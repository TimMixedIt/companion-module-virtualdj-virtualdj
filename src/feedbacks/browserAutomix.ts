import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'

export type BrowserAutomixFeedbacksSchema = {
	automix_active: { type: 'boolean'; options: Record<string, never> }
}

export function getBrowserAutomixFeedbacks(
	self: ModuleInstance,
): CompanionFeedbackDefinitions<BrowserAutomixFeedbacksSchema> {
	return {
		automix_active: {
			type: 'boolean',
			name: 'Automix is Active',
			description: 'UNCONFIRMED: paired with the "Automix: Start/Stop" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(0, 102, 51), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => self.state.global.automixActive,
		},
	}
}
