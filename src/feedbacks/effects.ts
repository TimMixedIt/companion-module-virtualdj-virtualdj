import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown, fxSlotDropdown } from '../optionHelpers.js'

export type EffectsFeedbacksSchema = {
	fx_active: { type: 'boolean'; options: { deck: number; slot: number } }
	mixfx_active: { type: 'boolean'; options: { deck: number } }
}

export function getEffectsFeedbacks(self: ModuleInstance): CompanionFeedbackDefinitions<EffectsFeedbacksSchema> {
	const deck = () => deckDropdown(self.config.decks)

	return {
		fx_active: {
			type: 'boolean',
			name: 'FX Slot is Active',
			description: 'CONFIRMED: paired with the "FX: Toggle Slot Active" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(153, 0, 153), color: combineRgb(255, 255, 255) },
			options: [deck(), fxSlotDropdown()],
			callback: (feedback) =>
				self.state.getDeck(self.clampDeck(feedback.options.deck)).effectActive[feedback.options.slot - 1] ?? false,
		},
		mixfx_active: {
			type: 'boolean',
			name: 'Mix FX is Active',
			description: 'CONFIRMED: paired with the "Mix FX: Toggle Active" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(153, 0, 153), color: combineRgb(255, 255, 255) },
			options: [deck()],
			callback: (feedback) => self.state.getDeck(self.clampDeck(feedback.options.deck)).mixfxActive,
		},
	}
}
