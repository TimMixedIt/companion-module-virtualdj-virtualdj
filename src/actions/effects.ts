import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown, fxSlotDropdown, percentNumber } from '../optionHelpers.js'
import * as effects from '../vdj/scripts/effects.js'

export type EffectsActionsSchema = {
	fx_toggle: { options: { deck: number; slot: number } }
	fx_select: { options: { deck: number; slot: number; effect: string } }
	fx_slider: { options: { deck: number; slot: number; param: number; position: number } }
	fx_disable_all_padfx: { options: { deck: number } }
	mixfx_toggle: { options: { deck: number } }
	mixfx_select: { options: { deck: number; effect: string } }
}

export function getEffectsActions(self: ModuleInstance): CompanionActionDefinitions<EffectsActionsSchema> {
	const deck = () => deckDropdown(self.config.decks)

	return {
		fx_toggle: {
			name: 'FX: Toggle Slot Active',
			options: [deck(), fxSlotDropdown()],
			callback: async (event) => {
				const d = self.clampDeck(event.options.deck)
				const currentlyActive = self.state.getDeck(d).effectActive[event.options.slot - 1] ?? false
				await self.vdj.execute(effects.effectActive(d, event.options.slot, !currentlyActive))
			},
		},
		fx_select: {
			name: 'FX: Select Effect Into Slot',
			options: [
				deck(),
				fxSlotDropdown(),
				{ type: 'textinput', id: 'effect', label: 'Effect Name', default: '', useVariables: true },
			],
			callback: async (event) => {
				await self.vdj.execute(
					effects.effectSelect(self.clampDeck(event.options.deck), event.options.slot, event.options.effect),
				)
			},
		},
		fx_slider: {
			name: 'FX: Set Slot Parameter',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [
				deck(),
				fxSlotDropdown(),
				{ type: 'number', id: 'param', label: 'Parameter Index', default: 1, min: 1, max: 4 },
				percentNumber('position', 'Position'),
			],
			callback: async (event) => {
				await self.vdj.execute(
					effects.effectSlider(
						self.clampDeck(event.options.deck),
						event.options.slot,
						event.options.param,
						event.options.position,
					),
				)
			},
		},
		fx_disable_all_padfx: {
			name: 'FX: Disable All Pad FX',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(effects.effectDisableAllPadFx(self.clampDeck(event.options.deck)))
			},
		},
		mixfx_toggle: {
			name: 'Mix FX: Toggle Active',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(effects.effectMixfxActivate(self.clampDeck(event.options.deck)))
			},
		},
		mixfx_select: {
			name: 'Mix FX: Select Effect',
			options: [
				deck(),
				{ type: 'textinput', id: 'effect', label: 'Effect Name', default: 'Filter', useVariables: true },
			],
			callback: async (event) => {
				await self.vdj.execute(effects.effectMixfxSelect(self.clampDeck(event.options.deck), event.options.effect))
			},
		},
	}
}
