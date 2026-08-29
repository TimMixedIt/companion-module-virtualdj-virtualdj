import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown } from '../optionHelpers.js'
import * as transport from '../vdj/scripts/transport.js'

export type TransportActionsSchema = {
	deck_play: { options: { deck: number } }
	deck_pause: { options: { deck: number } }
	deck_play_pause: { options: { deck: number } }
	deck_stop: { options: { deck: number } }
	deck_cue: { options: { deck: number } }
	deck_cue_play: { options: { deck: number } }
	deck_sync: { options: { deck: number } }
	deck_load_selected: { options: { deck: number } }
	deck_load_next: { options: { deck: number } }
	deck_load_previous: { options: { deck: number } }
	deck_unload: { options: { deck: number } }
}

export function getTransportActions(self: ModuleInstance): CompanionActionDefinitions<TransportActionsSchema> {
	const deck = () => deckDropdown(self.config.decks)

	return {
		deck_play: {
			name: 'Deck: Play',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.play(self.clampDeck(event.options.deck)))
			},
		},
		deck_pause: {
			name: 'Deck: Pause',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.pause(self.clampDeck(event.options.deck)))
			},
		},
		deck_play_pause: {
			name: 'Deck: Play/Pause Toggle',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md) - test on your VirtualDJ build before a live show.',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.playPause(self.clampDeck(event.options.deck)))
			},
		},
		deck_stop: {
			name: 'Deck: Stop',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.stop(self.clampDeck(event.options.deck)))
			},
		},
		deck_cue: {
			name: 'Deck: Cue',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.cue(self.clampDeck(event.options.deck)))
			},
		},
		deck_cue_play: {
			name: 'Deck: Cue + Play',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.cuePlay(self.clampDeck(event.options.deck)))
			},
		},
		deck_sync: {
			name: 'Deck: Sync',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.sync(self.clampDeck(event.options.deck)))
			},
		},
		deck_load_selected: {
			name: 'Deck: Load Selected/Browsed Track',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.browserEnter(self.clampDeck(event.options.deck)))
			},
		},
		deck_load_next: {
			name: 'Deck: Load Next Track',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.loadNext(self.clampDeck(event.options.deck)))
			},
		},
		deck_load_previous: {
			name: 'Deck: Load Previous Track',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.loadPrevious(self.clampDeck(event.options.deck)))
			},
		},
		deck_unload: {
			name: 'Deck: Unload',
			options: [deck()],
			callback: async (event) => {
				await self.vdj.execute(transport.unload(self.clampDeck(event.options.deck)))
			},
		},
	}
}
