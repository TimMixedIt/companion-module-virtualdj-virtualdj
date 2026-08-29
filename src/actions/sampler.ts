import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import * as sampler from '../vdj/scripts/sampler.js'

const SAMPLE_SLOT_CHOICES = Array.from({ length: 16 }, (_, i) => ({ id: i + 1, label: `Slot ${i + 1}` }))

export type SamplerActionsSchema = {
	sampler_play: { options: { slot: number } }
	sampler_stop: { options: { slot: number } }
	sampler_stop_all: { options: Record<string, never> }
	sampler_pad: { options: { pad: number } }
	sampler_pad_page: { options: { steps: number } }
	sampler_bank: { options: { steps: number } }
}

export function getSamplerActions(self: ModuleInstance): CompanionActionDefinitions<SamplerActionsSchema> {
	return {
		sampler_play: {
			name: 'Sampler: Play Slot',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [{ type: 'dropdown', id: 'slot', label: 'Slot', default: 1, choices: SAMPLE_SLOT_CHOICES }],
			callback: async (event) => {
				await self.vdj.execute(sampler.samplerPlay(event.options.slot))
			},
		},
		sampler_stop: {
			name: 'Sampler: Stop Slot',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [{ type: 'dropdown', id: 'slot', label: 'Slot', default: 1, choices: SAMPLE_SLOT_CHOICES }],
			callback: async (event) => {
				await self.vdj.execute(sampler.samplerStop(event.options.slot))
			},
		},
		sampler_stop_all: {
			name: 'Sampler: Stop All',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [],
			callback: async () => {
				await self.vdj.execute(sampler.samplerStopAll())
			},
		},
		sampler_pad: {
			name: 'Sampler: Trigger Visible Pad',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [
				{
					type: 'dropdown',
					id: 'pad',
					label: 'Pad (1-8 of current page)',
					default: 1,
					choices: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, label: `Pad ${i + 1}` })),
				},
			],
			callback: async (event) => {
				await self.vdj.execute(sampler.samplerPad(event.options.pad))
			},
		},
		sampler_pad_page: {
			name: 'Sampler: Change Pad Page',
			options: [{ type: 'number', id: 'steps', label: 'Steps (+1/-1)', default: 1, min: -8, max: 8 }],
			callback: async (event) => {
				await self.vdj.execute(sampler.samplerPadPage(event.options.steps))
			},
		},
		sampler_bank: {
			name: 'Sampler: Change Bank',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [{ type: 'number', id: 'steps', label: 'Steps (+1/-1)', default: 1, min: -20, max: 20 }],
			callback: async (event) => {
				await self.vdj.execute(sampler.samplerBank(event.options.steps))
			},
		},
	}
}
