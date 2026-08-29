import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown, percentNumber } from '../optionHelpers.js'
import * as mixer from '../vdj/scripts/mixer.js'

export type MixerActionsSchema = {
	mixer_crossfader: { options: { position: number } }
	mixer_volume: { options: { deck: number; level: number } }
	mixer_gain: { options: { deck: number; level: number } }
	mixer_mute_toggle: { options: { deck: number } }
	mixer_pfl_toggle: { options: { deck: number } }
	mixer_eq_high: { options: { deck: number; position: number } }
	mixer_eq_mid: { options: { deck: number; position: number } }
	mixer_eq_low: { options: { deck: number; position: number } }
	mixer_eq_kill_high_toggle: { options: { deck: number } }
	mixer_eq_kill_mid_toggle: { options: { deck: number } }
	mixer_eq_kill_low_toggle: { options: { deck: number } }
	mixer_master_volume: { options: { level: number } }
	mixer_booth_volume: { options: { level: number } }
	mixer_headphone_volume: { options: { level: number } }
	mixer_cross_assign: { options: { deck: number; side: 'left' | 'right' | 'thru' } }
}

export function getMixerActions(self: ModuleInstance): CompanionActionDefinitions<MixerActionsSchema> {
	const deck = () => deckDropdown(self.config.decks)

	return {
		mixer_crossfader: {
			name: 'Mixer: Set Crossfader Position',
			options: [percentNumber('position', 'Position (0 = left, 100 = right)')],
			callback: async (event) => {
				await self.vdj.execute(mixer.crossfader(event.options.position))
			},
		},
		mixer_volume: {
			name: 'Mixer: Set Deck Volume',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck(), percentNumber('level', 'Level')],
			callback: async (event) => {
				await self.vdj.execute(mixer.volume(self.clampDeck(event.options.deck), event.options.level))
			},
		},
		mixer_gain: {
			name: 'Mixer: Set Deck Gain',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck(), percentNumber('level', 'Level')],
			callback: async (event) => {
				await self.vdj.execute(mixer.gain(self.clampDeck(event.options.deck), event.options.level))
			},
		},
		mixer_mute_toggle: {
			name: 'Mixer: Toggle Mute',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(mixer.mute(self.clampDeck(event.options.deck)))
			},
		},
		mixer_pfl_toggle: {
			name: 'Mixer: Toggle PFL (Headphone Cue)',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(mixer.pfl(self.clampDeck(event.options.deck)))
			},
		},
		mixer_eq_high: {
			name: 'Mixer: Set EQ High',
			options: [deck(), percentNumber('position', 'Position (50 = center/flat)')],
			callback: async (event) => {
				await self.vdj.execute(mixer.eqHigh(self.clampDeck(event.options.deck), event.options.position))
			},
		},
		mixer_eq_mid: {
			name: 'Mixer: Set EQ Mid',
			options: [deck(), percentNumber('position', 'Position (50 = center/flat)')],
			callback: async (event) => {
				await self.vdj.execute(mixer.eqMid(self.clampDeck(event.options.deck), event.options.position))
			},
		},
		mixer_eq_low: {
			name: 'Mixer: Set EQ Low',
			options: [deck(), percentNumber('position', 'Position (50 = center/flat)')],
			callback: async (event) => {
				await self.vdj.execute(mixer.eqLow(self.clampDeck(event.options.deck), event.options.position))
			},
		},
		mixer_eq_kill_high_toggle: {
			name: 'Mixer: Toggle EQ Kill High',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(mixer.eqKillHigh(self.clampDeck(event.options.deck)))
			},
		},
		mixer_eq_kill_mid_toggle: {
			name: 'Mixer: Toggle EQ Kill Mid',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(mixer.eqKillMid(self.clampDeck(event.options.deck)))
			},
		},
		mixer_eq_kill_low_toggle: {
			name: 'Mixer: Toggle EQ Kill Low',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(mixer.eqKillLow(self.clampDeck(event.options.deck)))
			},
		},
		mixer_master_volume: {
			name: 'Mixer: Set Master Volume',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [percentNumber('level', 'Level')],
			callback: async (event) => {
				await self.vdj.execute(mixer.masterVolume(event.options.level))
			},
		},
		mixer_booth_volume: {
			name: 'Mixer: Set Booth Volume',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [percentNumber('level', 'Level')],
			callback: async (event) => {
				await self.vdj.execute(mixer.boothVolume(event.options.level))
			},
		},
		mixer_headphone_volume: {
			name: 'Mixer: Set Headphone Volume',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [percentNumber('level', 'Level')],
			callback: async (event) => {
				await self.vdj.execute(mixer.headphoneVolume(event.options.level))
			},
		},
		mixer_cross_assign: {
			name: 'Mixer: Assign Deck to Crossfader Side',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [
				deck(),
				{
					type: 'dropdown',
					id: 'side',
					label: 'Side',
					default: 'left',
					choices: [
						{ id: 'left', label: 'Left' },
						{ id: 'right', label: 'Right' },
						{ id: 'thru', label: 'Thru (unaffected)' },
					],
				},
			],
			callback: async (event) => {
				await self.vdj.execute(mixer.crossAssign(self.clampDeck(event.options.deck), event.options.side))
			},
		},
	}
}
