import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown } from '../optionHelpers.js'

export type MixerFeedbacksSchema = {
	deck_mute: { type: 'boolean'; options: { deck: number } }
	deck_pfl: { type: 'boolean'; options: { deck: number } }
	deck_eq_kill_high: { type: 'boolean'; options: { deck: number } }
	deck_eq_kill_mid: { type: 'boolean'; options: { deck: number } }
	deck_eq_kill_low: { type: 'boolean'; options: { deck: number } }
}

export function getMixerFeedbacks(self: ModuleInstance): CompanionFeedbackDefinitions<MixerFeedbacksSchema> {
	const deck = () => deckDropdown(self.config.decks)
	const eqKillStyle = { bgcolor: combineRgb(204, 68, 0), color: combineRgb(255, 255, 255) }

	return {
		deck_mute: {
			type: 'boolean',
			name: 'Deck is Muted',
			description:
				'UNCONFIRMED: paired with the "Mixer: Toggle Mute" action, but query-capability of `mute` itself was ' +
				'not independently confirmed (see docs/VERB_SOURCES.md). Verify on your own VirtualDJ build.',
			defaultStyle: { bgcolor: combineRgb(153, 0, 0), color: combineRgb(255, 255, 255) },
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).mute,
		},
		deck_pfl: {
			type: 'boolean',
			name: 'Deck PFL (Headphone Cue) is Active',
			description:
				'UNCONFIRMED: paired with the "Mixer: Toggle PFL" action, but query-capability of `pfl` itself was ' +
				'not independently confirmed (see docs/VERB_SOURCES.md). Verify on your own VirtualDJ build.',
			defaultStyle: { bgcolor: combineRgb(0, 102, 204), color: combineRgb(255, 255, 255) },
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).pfl,
		},
		deck_eq_kill_high: {
			type: 'boolean',
			name: 'EQ Kill High is Active',
			description: 'CONFIRMED (see docs/VERB_SOURCES.md).',
			defaultStyle: eqKillStyle,
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).eqKillHigh,
		},
		deck_eq_kill_mid: {
			type: 'boolean',
			name: 'EQ Kill Mid is Active',
			description: 'CONFIRMED (see docs/VERB_SOURCES.md).',
			defaultStyle: eqKillStyle,
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).eqKillMid,
		},
		deck_eq_kill_low: {
			type: 'boolean',
			name: 'EQ Kill Low is Active',
			description: 'CONFIRMED (see docs/VERB_SOURCES.md).',
			defaultStyle: eqKillStyle,
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).eqKillLow,
		},
	}
}
