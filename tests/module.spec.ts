import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InstanceStatus } from '@companion-module/base'
import { MockVdjServer } from './mockVdjServer.js'
import { createModuleInstance, defaultTestConfig } from './testHarness.js'

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('ModuleInstance wired up against a mock Network Control plugin', () => {
	let server: MockVdjServer
	let port: number

	beforeEach(async () => {
		server = new MockVdjServer()
		port = await server.listen()
	})

	afterEach(async () => {
		await server.close()
	})

	it('registers actions, feedbacks, presets and variables for the configured deck count', async () => {
		const { instance, context } = createModuleInstance()
		await instance.init(defaultTestConfig({ port, decks: 2 }))

		expect(context.actionDefinitions).toBeDefined()
		expect(context.actionDefinitions?.['deck_play']).toBeDefined()
		expect(context.actionDefinitions?.['mixer_crossfader']).toBeDefined()
		expect(context.actionDefinitions?.['hotcue_trigger']).toBeDefined()
		expect(context.actionDefinitions?.['fx_toggle']).toBeDefined()
		expect(context.actionDefinitions?.['automix_toggle']).toBeDefined()
		expect(context.actionDefinitions?.['sampler_play']).toBeDefined()
		expect(context.actionDefinitions?.['record_toggle']).toBeDefined()

		expect(context.feedbackDefinitions?.['deck_playing']).toBeDefined()
		expect(context.feedbackDefinitions?.['deck_eq_kill_high']).toBeDefined()
		expect(context.feedbackDefinitions?.['deck_hotcue_set']).toBeDefined()
		expect(context.feedbackDefinitions?.['fx_active']).toBeDefined()

		expect(context.variableDefinitions?.['deck1_title']).toBeDefined()
		expect(context.variableDefinitions?.['deck2_title']).toBeDefined()
		expect(context.variableDefinitions?.['deck3_title']).toBeUndefined() // only 2 decks configured
		expect(context.variableDefinitions?.['deck1_artist']).toBeDefined()
		expect(context.variableDefinitions?.['deck1_bpm']).toBeDefined()
		expect(context.variableDefinitions?.['deck1_remaining']).toBeDefined()
		expect(context.variableDefinitions?.['deck1_pitch']).toBeDefined()
		expect(context.variableDefinitions?.['deck1_key']).toBeDefined()

		expect(context.presetDefinitions).toBeDefined()
		expect(Object.keys(context.presetDefinitions ?? {}).length).toBeGreaterThan(0)

		await instance.destroy()
	})

	it('an action callback sends exactly the expected VDJScript request', async () => {
		const { instance, context } = createModuleInstance()
		await instance.init(defaultTestConfig({ port }))

		const before = server.requestLog.length
		await context.actionDefinitions?.['deck_play']?.callback?.(
			{ id: 'a1', controlId: 'c1', actionId: 'deck_play', options: { deck: 2 }, surfaceId: undefined },
			{ type: 'action' },
		)
		const sent = server.requestLog.slice(before)
		expect(sent).toHaveLength(1)
		expect(sent[0]).toMatchObject({ endpoint: 'execute', script: 'deck 2 play' })
		expect(server.deck(2).playing).toBe(true)

		await context.actionDefinitions?.['mixer_eq_kill_high_toggle']?.callback?.(
			{ id: 'a2', controlId: 'c2', actionId: 'mixer_eq_kill_high_toggle', options: { deck: 1 }, surfaceId: undefined },
			{ type: 'action' },
		)
		expect(server.requestLog.at(-1)).toMatchObject({ endpoint: 'execute', script: 'deck 1 eq_kill_high' })

		await instance.destroy()
	})

	it('a feedback reflects the cached poll state, not a live request', async () => {
		const { instance, context } = createModuleInstance()
		await instance.init(defaultTestConfig({ port }))

		instance.state.getDeck(1).playing = true
		const result = context.feedbackDefinitions?.['deck_playing']?.callback?.(
			{
				type: 'boolean',
				id: 'f1',
				controlId: 'c1',
				feedbackId: 'deck_playing',
				options: { deck: 1 },
				previousOptions: null,
			},
			{ type: 'feedback' },
		)
		expect(result).toBe(true)

		instance.state.getDeck(1).playing = false
		const result2 = context.feedbackDefinitions?.['deck_playing']?.callback?.(
			{
				type: 'boolean',
				id: 'f1',
				controlId: 'c1',
				feedbackId: 'deck_playing',
				options: { deck: 1 },
				previousOptions: null,
			},
			{ type: 'feedback' },
		)
		expect(result2).toBe(false)

		await instance.destroy()
	})

	it('reaches InstanceStatus.Ok and populates variables after a real poll pass', async () => {
		server.loadTrack(1, { title: 'Body Lang', artist: 'Balanka', bpm: '128', key: 'Am', pitch: '100%' })
		// Single deck to keep the first pass (which always includes the slow tier -
		// track metadata, hot cues, sampler slots - see Poller) short and deterministic.
		const config = defaultTestConfig({ port, pollIntervalMs: 30, decks: 1 })
		const { instance, context } = createModuleInstance()
		await instance.init(config)

		// Generous margin for the first full pass (fast + slow tier for 1 deck, ~50 sequential
		// requests at ~5ms apart) to finish on a loaded CI machine.
		await sleep(1500)

		expect(context.statusUpdates.some((s) => s.status === InstanceStatus.Ok)).toBe(true)
		expect(context.variableValues['deck1_title']).toBe('Body Lang')
		expect(context.variableValues['deck1_artist']).toBe('Balanka')
		expect(context.variableValues['deck1_bpm']).toBe('128')

		await instance.destroy()
	})

	it('surfaces a wrong bearer token as InstanceStatus.AuthenticationFailure, not a crash', async () => {
		server.setBearerToken('correct-token')
		const config = defaultTestConfig({ port, bearerToken: 'wrong-token', pollIntervalMs: 30 })
		const { instance, context } = createModuleInstance()

		await expect(instance.init(config)).resolves.toBeUndefined()
		await sleep(150)

		expect(context.statusUpdates.some((s) => s.status === InstanceStatus.AuthenticationFailure)).toBe(true)

		await instance.destroy()
	})

	it('surfaces a dropped connection as InstanceStatus.ConnectionFailure, not a crash', async () => {
		const config = defaultTestConfig({ port: port + 1, pollIntervalMs: 30 }) // nothing listens here
		const { instance, context } = createModuleInstance()

		await expect(instance.init(config)).resolves.toBeUndefined()
		await sleep(150)

		expect(context.statusUpdates.some((s) => s.status === InstanceStatus.ConnectionFailure)).toBe(true)

		await instance.destroy()
	})

	it('surfaces a non-2xx HTTP error as InstanceStatus.UnknownError, not a crash', async () => {
		server.failNextRequests(1000, 503)
		const config = defaultTestConfig({ port, pollIntervalMs: 30 })
		const { instance, context } = createModuleInstance()

		await expect(instance.init(config)).resolves.toBeUndefined()
		await sleep(150)

		expect(context.statusUpdates.some((s) => s.status === InstanceStatus.UnknownError)).toBe(true)

		await instance.destroy()
	})

	it('recovers to Ok after a connection failure clears', async () => {
		server.failNextRequests(3, 500)
		const config = defaultTestConfig({ port, pollIntervalMs: 20, decks: 1 })
		const { instance, context } = createModuleInstance()
		await instance.init(config)

		// 3 failing passes (1 request each, fail fast) + one full successful fast-tier pass,
		// with generous margin for a loaded CI machine.
		await sleep(1000)

		const statuses = context.statusUpdates.map((s) => s.status)
		expect(statuses).toContain(InstanceStatus.UnknownError)
		expect(statuses.at(-1)).toBe(InstanceStatus.Ok)

		await instance.destroy()
	})
})
