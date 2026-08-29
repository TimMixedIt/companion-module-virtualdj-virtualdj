import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown, hotCueDropdown } from '../optionHelpers.js'

export type LoopsHotcuesFeedbacksSchema = {
	deck_loop_active: { type: 'boolean'; options: { deck: number } }
	deck_hotcue_set: { type: 'boolean'; options: { deck: number; slot: number } }
}

export function getLoopsHotcuesFeedbacks(
	self: ModuleInstance,
): CompanionFeedbackDefinitions<LoopsHotcuesFeedbacksSchema> {
	const deck = () => deckDropdown(self.config.decks)

	return {
		deck_loop_active: {
			type: 'boolean',
			name: 'Loop is Active',
			description: 'UNCONFIRMED: paired with the "Loop: Set/Remove Auto Loop" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(230, 179, 0), color: combineRgb(0, 0, 0) },
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).loopActive,
		},
		deck_hotcue_set: {
			type: 'boolean',
			name: 'Hot Cue is Set',
			description: 'UNCONFIRMED: paired with the "Hot Cue: Set/Jump" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(0, 153, 76), color: combineRgb(255, 255, 255) },
			options: [deck(), hotCueDropdown()],
			callback: (feedback) =>
				self.state.getDeck(self.clampDeck(feedback.options.deck)).hotCueSet[feedback.options.slot - 1] ?? false,
		},
	}
}
