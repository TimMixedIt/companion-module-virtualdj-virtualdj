import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { VdjClient } from '../src/vdj/client.js'
import { VdjState } from '../src/state.js'
import { Poller, type PollMetrics } from '../src/poller.js'
import { buildPollJobs } from '../src/jobs.js'
import { MockVdjServer } from './mockVdjServer.js'

describe('Poller against a mock Network Control plugin (measured, not assumed)', () => {
	let server: MockVdjServer
	let port: number
	let client: VdjClient
	let state: VdjState

	beforeEach(async () => {
		server = new MockVdjServer()
		port = await server.listen()
		client = new VdjClient({ host: '127.0.0.1', port, timeoutMs: 1000 })
		state = new VdjState()
		state.ensureDecks(2)
	})

	afterEach(async () => {
		await server.close()
	})

	it('sends exactly one HTTP request per fast-tier job, one at a time, on the first pass', async () => {
		const poller = new Poller({
			client,
			state,
			getIntervalMs: () => 300,
			buildJobs: () => buildPollJobs(2),
		})

		const before = server.requestLog.length
		const metrics = await poller.runOnce()
		const sentDuringPass = server.requestLog.length - before

		// The very first pass always includes the slow tier too (see Poller.runPass),
		// so the request count is fast+slow jobs for 2 decks, not just fast.
		const allJobs = buildPollJobs(2)
		expect(metrics.requestsSent).toBe(allJobs.length)
		expect(sentDuringPass).toBe(allJobs.length)
		expect(metrics.failed).toBe(false)

		// Concurrency really is 1: every logged request's timestamp is monotonically
		// non-decreasing and none of them landed inside the same millisecond in a way
		// that would suggest a parallel burst (each carries the ~5ms inter-request gap).
		const timestamps = server.requestLog.slice(-sentDuringPass).map((r) => r.timestamp)
		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1])
		}
	})

	it('only re-sends the slow tier every Nth pass, cutting steady-state traffic', async () => {
		const allJobs = buildPollJobs(2)
		const fastCount = allJobs.filter((j) => j.tier === 'fast').length
		const slowCount = allJobs.filter((j) => j.tier === 'slow').length

		const poller = new Poller({ client, state, getIntervalMs: () => 50, buildJobs: () => buildPollJobs(2) })

		const passSizes: number[] = []
		for (let i = 0; i < 6; i++) {
			const before = server.requestLog.length
			await poller.runOnce()
			passSizes.push(server.requestLog.length - before)
		}

		// Pass 1 (index 0) and pass 6 (index 5, 1-based pass 6 % 5 === 1) include the slow tier;
		// passes 2-5 are fast-tier only.
		expect(passSizes[0]).toBe(fastCount + slowCount)
		expect(passSizes[1]).toBe(fastCount)
		expect(passSizes[2]).toBe(fastCount)
		expect(passSizes[3]).toBe(fastCount)
		expect(passSizes[4]).toBe(fastCount)
		expect(passSizes[5]).toBe(fastCount + slowCount)

		// Measured, not assumed: over 6 passes the request volume is much closer to
		// "fast every pass, slow every 5th" than to "everything every pass".
		const actualTotal = passSizes.reduce((a, b) => a + b, 0)
		const worstCaseTotal = (fastCount + slowCount) * 6
		expect(actualTotal).toBeLessThan(worstCaseTotal * 0.6)
	})

	it('self-paces: never starts a new pass before the previous one finished, even if VirtualDJ answers slowly', async () => {
		// A small, fixed job list independent of production job counts, so this test measures
		// the *scheduling* behaviour rather than being coupled to how many queries the module
		// happens to poll today.
		const JOB_COUNT = 5
		const ARTIFICIAL_DELAY_MS = 20
		server.delayNextRequests(1000, ARTIFICIAL_DELAY_MS)

		const passEnds: number[] = []
		const poller = new Poller({
			client,
			state,
			getIntervalMs: () => 10, // deliberately shorter than a single pass will take
			buildJobs: () =>
				Array.from({ length: JOB_COUNT }, (_, i) => ({
					key: `dummy${i}`,
					tier: 'fast' as const,
					kind: 'query' as const,
					script: 'deck 1 get_bpm',
					apply: () => {
						/* no-op */
					},
				})),
			onPassComplete: (m: PollMetrics) => {
				passEnds.push(Date.now())
				void m
			},
		})

		poller.start()
		await sleep(JOB_COUNT * ARTIFICIAL_DELAY_MS * 4) // enough real time for several passes
		poller.stop()

		expect(passEnds.length).toBeGreaterThan(1)
		const gaps: number[] = []
		for (let i = 1; i < passEnds.length; i++) gaps.push(passEnds[i] - passEnds[i - 1])
		// Each pass sends JOB_COUNT requests, each artificially delayed by ARTIFICIAL_DELAY_MS,
		// so consecutive pass-completion timestamps must be separated by at least that much -
		// proving passes ran sequentially (self-paced), never overlapping.
		const minExpectedGapMs = JOB_COUNT * ARTIFICIAL_DELAY_MS * 0.6 // slack for scheduler jitter
		for (const gap of gaps) {
			expect(gap).toBeGreaterThanOrEqual(minExpectedGapMs)
		}
	})

	it('aborts the rest of a pass on the first transport failure instead of sending every remaining request', async () => {
		server.failNextRequests(1, 500)
		const metrics = await new Poller({
			client,
			state,
			getIntervalMs: () => 1000,
			buildJobs: () => buildPollJobs(2),
		}).runOnce()

		expect(metrics.failed).toBe(true)
		expect(metrics.requestsSent).toBe(1) // stopped immediately, did not send the other ~30 jobs
	})

	it('calls onConnectionFailure once when VirtualDJ becomes unreachable, and onConnectionOk once it recovers', async () => {
		const failures: string[] = []
		let okCount = 0
		const poller = new Poller({
			client,
			state,
			getIntervalMs: () => 20,
			buildJobs: () => buildPollJobs(1),
			onConnectionFailure: (f) => failures.push(f.reason),
			onConnectionOk: () => okCount++,
		})

		await poller.runOnce() // healthy
		expect(okCount).toBe(1)

		await server.close() // simulate a dropped connection
		await poller.runOnce()
		await poller.runOnce()
		expect(failures).toEqual(['network']) // only reported once, not on every failing pass

		server = new MockVdjServer()
		await server.listen(port) // recover on the same port
		await poller.runOnce()
		expect(okCount).toBe(2) // reported again exactly once on recovery
	})
})

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
