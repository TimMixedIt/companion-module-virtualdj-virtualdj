import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown } from '../optionHelpers.js'
import * as browserAutomix from '../vdj/scripts/browserAutomix.js'

export type BrowserAutomixActionsSchema = {
	browser_scroll: { options: { steps: number } }
	browser_search: { options: { text: string } }
	browser_clear_search: { options: Record<string, never> }
	automix_toggle: { options: Record<string, never> }
	automix_skip: { options: Record<string, never> }
	automix_mix_now: { options: { durationMs: number } }
	playlist_add_selected: { options: Record<string, never> }
	browser_load_to_deck: { options: { deck: number } }
}

export function getBrowserAutomixActions(
	self: ModuleInstance,
): CompanionActionDefinitions<BrowserAutomixActionsSchema> {
	return {
		browser_scroll: {
			name: 'Browser: Scroll',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [{ type: 'number', id: 'steps', label: 'Steps (negative = up)', default: 1, min: -50, max: 50 }],
			callback: async (event) => {
				await self.vdj.execute(browserAutomix.browserScroll(event.options.steps))
			},
		},
		browser_search: {
			name: 'Browser: Search',
			options: [{ type: 'textinput', id: 'text', label: 'Search Text', default: '', useVariables: true }],
			callback: async (event) => {
				await self.vdj.execute(browserAutomix.search(event.options.text))
			},
		},
		browser_clear_search: {
			name: 'Browser: Clear Search',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [],
			callback: async () => {
				await self.vdj.execute(browserAutomix.clearSearch())
			},
		},
		automix_toggle: {
			name: 'Automix: Start/Stop',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [],
			callback: async () => {
				await self.vdj.execute(browserAutomix.automix())
			},
		},
		automix_skip: {
			name: 'Automix: Skip Current Song',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [],
			callback: async () => {
				await self.vdj.execute(browserAutomix.automixSkip())
			},
		},
		automix_mix_now: {
			name: 'Automix: Mix Now',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [
				{ type: 'number', id: 'durationMs', label: 'Crossfade Duration (ms)', default: 4000, min: 0, max: 30000 },
			],
			callback: async (event) => {
				await self.vdj.execute(browserAutomix.mixNow(event.options.durationMs))
			},
		},
		playlist_add_selected: {
			name: 'Automix: Add Selected Songs to Playlist',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [],
			callback: async () => {
				await self.vdj.execute(browserAutomix.playlistAdd())
			},
		},
		browser_load_to_deck: {
			name: 'Browser: Load Selected to Deck',
			options: [deckDropdown(self.config.decks)],
			callback: async (event) => {
				await self.vdj.execute(browserAutomix.loadSelected(self.clampDeck(event.options.deck)))
			},
		},
	}
}
