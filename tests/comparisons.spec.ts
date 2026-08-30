import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CompanionBooleanFeedbackDefinition, CompanionOptionValues } from '@companion-module/base'
import { MockVdjServer } from './mockVdjServer.js'
import { createModuleInstance, defaultTestConfig } from './testHarness.js'
import type ModuleInstance from '../src/main.js'
import type { FakeContext } from './testHarness.js'
import type { FeedbacksSchema } from '../src/feedbacks/index.js'

describe('comparison feedbacks (BPM/key/pitch, no live requests)', () => {
	let server: MockVdjServer
	let port: number
	let instance: ModuleInstance
	let context: FakeContext

	beforeEach(async () => {
		server = new MockVdjServer()
		port = await server.listen()
		;({ instance, context } = createModuleInstance())
		await instance.init(defaultTestConfig({ port, decks: 2 }))
	})

	afterEach(async () => {
		await instance.destroy()
		await server.close()
	})

	function feedback<K extends keyof FeedbacksSchema>(id: K, options: CompanionOptionValues): boolean | undefined {
		const raw = context.feedbackDefinitions?.[id]
		if (!raw) throw new Error(`${id} feedback not registered`)
		const def = raw as CompanionBooleanFeedbackDefinition<CompanionOptionValues>
		const result = def.callback(
			{ type: 'boolean', id: 'f1', controlId: 'c1', feedbackId: id, options, previousOptions: null },
			{ type: 'feedback' },
		)
		return result as boolean | undefined
	}

	it('deck_bpm_compare evaluates against the cached BPM, not a live request', () => {
		instance.state.getDeck(1).bpm = '145.0'
		expect(feedback('deck_bpm_compare', { deck: 1, operator: '>', threshold: 140 })).toBe(true)
		expect(feedback('deck_bpm_compare', { deck: 1, operator: '<', threshold: 140 })).toBe(false)
		expect(server.requestLog).toHaveLength(0) // purely from cached state, no HTTP call
	})

	it('deck_bpm_compare is false while the deck has no BPM yet', () => {
		instance.state.getDeck(1).bpm = ''
		expect(feedback('deck_bpm_compare', { deck: 1, operator: '>', threshold: 0 })).toBe(false)
	})

	it('decks_bpm_match is true within tolerance and false outside it', () => {
		instance.state.getDeck(1).bpm = '128.0'
		instance.state.getDeck(2).bpm = '128.3'
		expect(feedback('decks_bpm_match', { deckA: 1, deckB: 2, toleranceBpm: 0.5 })).toBe(true)

		instance.state.getDeck(2).bpm = '130.0'
		expect(feedback('decks_bpm_match', { deckA: 1, deckB: 2, toleranceBpm: 0.5 })).toBe(false)
	})

	it('decks_key_match compares exact key strings', () => {
		instance.state.getDeck(1).key = 'Am'
		instance.state.getDeck(2).key = 'Am'
		expect(feedback('decks_key_match', { deckA: 1, deckB: 2 })).toBe(true)

		instance.state.getDeck(2).key = 'Cm'
		expect(feedback('decks_key_match', { deckA: 1, deckB: 2 })).toBe(false)
	})

	it('decks_key_match is false while either deck has no key yet', () => {
		instance.state.getDeck(1).key = ''
		instance.state.getDeck(2).key = 'Am'
		expect(feedback('decks_key_match', { deckA: 1, deckB: 2 })).toBe(false)
	})

	it('deck_pitch_compare evaluates the cached pitch percentage', () => {
		instance.state.getDeck(1).pitch = '106%'
		expect(feedback('deck_pitch_compare', { deck: 1, operator: '>', thresholdPercent: 105 })).toBe(true)
		expect(feedback('deck_pitch_compare', { deck: 1, operator: '<=', thresholdPercent: 105 })).toBe(false)
	})
})
