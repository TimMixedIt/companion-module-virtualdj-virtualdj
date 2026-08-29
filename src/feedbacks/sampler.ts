import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'

const SAMPLE_SLOT_CHOICES = Array.from({ length: 16 }, (_, i) => ({ id: i + 1, label: `Slot ${i + 1}` }))

export type SamplerFeedbacksSchema = {
	sampler_slot_loaded: { type: 'boolean'; options: { slot: number } }
	sampler_any_playing: { type: 'boolean'; options: Record<string, never> }
}

export function getSamplerFeedbacks(self: ModuleInstance): CompanionFeedbackDefinitions<SamplerFeedbacksSchema> {
	return {
		sampler_slot_loaded: {
			type: 'boolean',
			name: 'Sampler Slot has a Sample Loaded',
			description: 'CONFIRMED (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(0, 102, 153), color: combineRgb(255, 255, 255) },
			options: [{ type: 'dropdown', id: 'slot', label: 'Slot', default: 1, choices: SAMPLE_SLOT_CHOICES }],
			callback: (feedback) => self.state.global.samplerSlotLoaded[feedback.options.slot - 1] ?? false,
		},
		sampler_any_playing: {
			type: 'boolean',
			name: 'Any Sample is Playing',
			description: 'UNCONFIRMED: paired with the sampler play/stop actions (see docs/VERB_SOURCES.md).',
			defaultStyle: { bgcolor: combineRgb(0, 102, 153), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => self.state.global.samplerUsed,
		},
	}
}
