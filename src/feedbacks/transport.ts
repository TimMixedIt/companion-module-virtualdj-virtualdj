import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown } from '../optionHelpers.js'

export type TransportFeedbacksSchema = {
	deck_playing: { type: 'boolean'; options: { deck: number } }
	deck_loaded: { type: 'boolean'; options: { deck: number } }
	deck_has_error: { type: 'boolean'; options: { deck: number } }
}

export function getTransportFeedbacks(self: ModuleInstance): CompanionFeedbackDefinitions<TransportFeedbacksSchema> {
	const deck = () => deckDropdown(self.config.decks)

	return {
		deck_playing: {
			type: 'boolean',
			name: 'Deck is Playing',
			description: 'CONFIRMED: paired with the "Deck: Play" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(0, 204, 0), color: combineRgb(0, 0, 0) },
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).playing,
		},
		deck_loaded: {
			type: 'boolean',
			name: 'Deck has a Track Loaded',
			description: 'CONFIRMED (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(0, 51, 153), color: combineRgb(255, 255, 255) },
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).loaded,
		},
		deck_has_error: {
			type: 'boolean',
			name: 'Deck has a Load Error',
			description: 'CONFIRMED (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).hasError,
		},
	}
}
