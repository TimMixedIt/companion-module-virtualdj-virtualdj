import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown, hotCueDropdown } from '../optionHelpers.js'
import * as loops from '../vdj/scripts/loopsHotcues.js'

const LOOP_BEAT_CHOICES = [0.25, 0.5, 1, 2, 4, 8, 16, 32]

export type LoopsHotcuesActionsSchema = {
	loop_set: { options: { deck: number; beats: number } }
	loop_in: { options: { deck: number } }
	loop_out: { options: { deck: number } }
	loop_exit: { options: { deck: number } }
	reloop: { options: { deck: number } }
	loop_double: { options: { deck: number } }
	loop_half: { options: { deck: number } }
	loop_roll: { options: { deck: number; beats: number } }
	hotcue_trigger: { options: { deck: number; slot: number } }
	hotcue_delete: { options: { deck: number; slot: number } }
	cue_goto: { options: { deck: number; slot: number } }
}

export function getLoopsHotcuesActions(self: ModuleInstance): CompanionActionDefinitions<LoopsHotcuesActionsSchema> {
	const deck = () => deckDropdown(self.config.decks)
	const beatsDropdown = <TKey extends string>(id: TKey, label: string) => ({
		type: 'dropdown' as const,
		id,
		label,
		default: 4,
		choices: LOOP_BEAT_CHOICES.map((b) => ({ id: b, label: `${b} beats` })),
	})

	return {
		loop_set: {
			name: 'Loop: Set/Remove Auto Loop',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck(), beatsDropdown('beats', 'Length')],
			callback: async (event) => {
				await self.vdj.execute(loops.loop(self.clampDeck(event.options.deck), event.options.beats))
			},
		},
		loop_in: {
			name: 'Loop: Set In Point',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(loops.loopIn(self.clampDeck(event.options.deck)))
			},
		},
		loop_out: {
			name: 'Loop: Set Out Point',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(loops.loopOut(self.clampDeck(event.options.deck)))
			},
		},
		loop_exit: {
			name: 'Loop: Exit',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(loops.loopExit(self.clampDeck(event.options.deck)))
			},
		},
		reloop: {
			name: 'Loop: Reloop (Jump to Loop Start)',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(loops.reloop(self.clampDeck(event.options.deck)))
			},
		},
		loop_double: {
			name: 'Loop: Double Length',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(loops.loopDouble(self.clampDeck(event.options.deck)))
			},
		},
		loop_half: {
			name: 'Loop: Halve Length',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(loops.loopHalf(self.clampDeck(event.options.deck)))
			},
		},
		loop_roll: {
			name: 'Loop: Roll (Momentary)',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck(), beatsDropdown('beats', 'Length')],
			callback: async (event) => {
				await self.vdj.execute(loops.loopRoll(self.clampDeck(event.options.deck), event.options.beats))
			},
		},
		hotcue_trigger: {
			name: 'Hot Cue: Set/Jump',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck(), hotCueDropdown()],
			callback: async (event) => {
				await self.vdj.execute(loops.hotCue(self.clampDeck(event.options.deck), event.options.slot))
			},
		},
		hotcue_delete: {
			name: 'Hot Cue: Delete',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck(), hotCueDropdown()],
			callback: async (event) => {
				await self.vdj.execute(loops.deleteCue(self.clampDeck(event.options.deck), event.options.slot))
			},
		},
		cue_goto: {
			name: 'Cue: Jump to Numbered Cue',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck(), hotCueDropdown('slot', 'Cue Number')],
			callback: async (event) => {
				await self.vdj.execute(loops.gotoCue(self.clampDeck(event.options.deck), event.options.slot))
			},
		},
	}
}
