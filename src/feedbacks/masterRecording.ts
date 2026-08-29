import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'

export type MasterRecordingFeedbacksSchema = {
	recording_active: { type: 'boolean'; options: Record<string, never> }
	broadcasting_active: { type: 'boolean'; options: Record<string, never> }
}

export function getMasterRecordingFeedbacks(
	self: ModuleInstance,
): CompanionFeedbackDefinitions<MasterRecordingFeedbacksSchema> {
	return {
		recording_active: {
			type: 'boolean',
			name: 'Recording is Active',
			description: 'UNCONFIRMED: paired with the "Recording: Start/Stop" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => self.state.global.recording,
		},
		broadcasting_active: {
			type: 'boolean',
			name: 'Broadcasting is Active',
			description: 'UNCONFIRMED: paired with the "Broadcast: Start/Stop" action (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => self.state.global.broadcasting,
		},
	}
}
