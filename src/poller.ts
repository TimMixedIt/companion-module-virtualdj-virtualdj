import type { VdjClient, VdjFailure } from './vdj/client.js'
import type { VdjState } from './state.js'

/**
 * Polling design
 * ===============
 * The Network Control plugin has no push channel (confirmed: a WebSocket
 * upgrade is ignored and there is no /events endpoint - see
 * docs/VERB_SOURCES.md), so every piece of feedback/variable state has to be
 * fetched with its own request. To avoid hammering VirtualDJ:
 *
 * 1. Requests are sent strictly one at a time (concurrency 1), with a small
 *    fixed gap between them. A single-threaded HTTP request loop can never
 *    burst a pile of parallel connections at the plugin.
 * 2. Jobs are split into two tiers. "fast" jobs cover state that a performer
 *    needs to see change essentially immediately on a button (play/pause,
 *    mute, PFL, EQ kill, loop/FX active) and run every pass. "slow" jobs
 *    cover state that only changes when a track loads or a cue/sample is
 *    (re)programmed (track metadata, hot cue existence, sampler slots,
 *    automix/record state) and run only on every Nth pass
 *    (`slowTierMultiplier`, default 5) - configured decks x ~15 fast queries
 *    already dominates the request budget, so this alone cuts steady-state
 *    traffic roughly in half without the user needing another config field.
 * 3. The loop is self-pacing: it waits for the previous pass (including all
 *    its requests) to fully finish before scheduling the next one with
 *    `setTimeout`, rather than using `setInterval`. If VirtualDJ (or the
 *    network) is slow, passes simply space out further instead of piling up
 *    concurrent polls.
 * 4. Any transport-level failure (network error, timeout, HTTP error,
 *    wrong bearer token) aborts the rest of that pass immediately - there is
 *    no point sending 40 more requests to a server that just refused or
 *    dropped the first one - and is reported once via `onConnectionChange`
 *    so the module can update its connection status. The next pass starts
 *    fresh after the normal interval, so a recovered connection is noticed
 *    within one interval.
 *
 * This module intentionally does not guess these numbers - see
 * `tests/poller.spec.ts`, which runs this exact class against a mock server
 * and measures the request timing and counts.
 */

export interface PollJob {
	/** Unique per job, used for logging/metrics only. */
	key: string
	tier: 'fast' | 'slow'
	kind: 'execute' | 'query'
	script: string
	apply: (body: string, state: VdjState) => void
}

export interface PollMetrics {
	pass: number
	requestsSent: number
	passDurationMs: number
	failed: boolean
}

export interface PollerOptions {
	client: VdjClient
	state: VdjState
	getIntervalMs: () => number
	buildJobs: () => PollJob[]
	slowTierMultiplier?: number
	interRequestGapMs?: number
	onConnectionOk?: () => void
	onConnectionFailure?: (failure: VdjFailure) => void
	onPassComplete?: (metrics: PollMetrics) => void
	log?: (level: 'debug' | 'warn', message: string) => void
}

const DEFAULT_SLOW_TIER_MULTIPLIER = 5
const DEFAULT_INTER_REQUEST_GAP_MS = 5

export class Poller {
	private readonly client: VdjClient
	private readonly state: VdjState
	private readonly getIntervalMs: () => number
	private readonly buildJobs: () => PollJob[]
	private readonly slowTierMultiplier: number
	private readonly interRequestGapMs: number
	private readonly onConnectionOk: (() => void) | undefined
	private readonly onConnectionFailure: ((failure: VdjFailure) => void) | undefined
	private readonly onPassComplete: ((metrics: PollMetrics) => void) | undefined
	private readonly log: ((level: 'debug' | 'warn', message: string) => void) | undefined

	private timer: ReturnType<typeof setTimeout> | undefined
	private stopped = true
	private running = false
	private passCounter = 0
	private lastConnectionOk: boolean | undefined

	constructor(options: PollerOptions) {
		this.client = options.client
		this.state = options.state
		this.getIntervalMs = options.getIntervalMs
		this.buildJobs = options.buildJobs
		this.slowTierMultiplier = options.slowTierMultiplier ?? DEFAULT_SLOW_TIER_MULTIPLIER
		this.interRequestGapMs = options.interRequestGapMs ?? DEFAULT_INTER_REQUEST_GAP_MS
		this.onConnectionOk = options.onConnectionOk
		this.onConnectionFailure = options.onConnectionFailure
		this.onPassComplete = options.onPassComplete
		this.log = options.log
	}

	start(): void {
		if (!this.stopped) return
		this.stopped = false
		this.scheduleNext(0)
	}

	stop(): void {
		this.stopped = true
		if (this.timer) {
			clearTimeout(this.timer)
			this.timer = undefined
		}
	}

	get isRunning(): boolean {
		return !this.stopped
	}

	/** Runs a single pass immediately and returns its metrics, without touching the schedule. Mainly for tests. */
	async runOnce(): Promise<PollMetrics> {
		return this.runPass()
	}

	private scheduleNext(delayMs: number): void {
		if (this.stopped) return
		this.timer = setTimeout(() => {
			void this.tick()
		}, delayMs)
	}

	private async tick(): Promise<void> {
		if (this.running || this.stopped) return
		this.running = true
		let metrics: PollMetrics
		try {
			metrics = await this.runPass()
		} finally {
			this.running = false
		}
		if (this.stopped) return
		const interval = this.getIntervalMs()
		const remaining = Math.max(0, interval - metrics.passDurationMs)
		this.scheduleNext(remaining)
	}

	private async runPass(): Promise<PollMetrics> {
		const pass = ++this.passCounter
		const includeSlowTier = pass % this.slowTierMultiplier === 1 // first pass included, so state populates immediately
		const jobs = this.buildJobs().filter((job) => job.tier === 'fast' || includeSlowTier)

		const start = Date.now()
		let requestsSent = 0
		let failed = false

		for (const job of jobs) {
			requestsSent++
			const result =
				job.kind === 'execute' ? await this.client.execute(job.script) : await this.client.query(job.script)

			if (!result.ok) {
				failed = true
				this.log?.('warn', `poll job "${job.key}" failed: ${result.message}`)
				if (this.lastConnectionOk !== false) {
					this.lastConnectionOk = false
					this.onConnectionFailure?.(result)
				}
				break
			}

			if (this.lastConnectionOk !== true) {
				this.lastConnectionOk = true
				this.onConnectionOk?.()
			}

			try {
				job.apply(result.body, this.state)
			} catch (err) {
				this.log?.('warn', `poll job "${job.key}" apply() threw: ${err instanceof Error ? err.message : String(err)}`)
			}

			if (this.interRequestGapMs > 0) {
				await sleep(this.interRequestGapMs)
			}
		}

		const metrics: PollMetrics = {
			pass,
			requestsSent,
			passDurationMs: Date.now() - start,
			failed,
		}
		this.onPassComplete?.(metrics)
		return metrics
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
