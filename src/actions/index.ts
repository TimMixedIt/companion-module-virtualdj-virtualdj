import type ModuleInstance from '../main.js'
import { getTransportActions, type TransportActionsSchema } from './transport.js'
import { getMixerActions, type MixerActionsSchema } from './mixer.js'
import { getLoopsHotcuesActions, type LoopsHotcuesActionsSchema } from './loopsHotcues.js'
import { getEffectsActions, type EffectsActionsSchema } from './effects.js'
import { getBrowserAutomixActions, type BrowserAutomixActionsSchema } from './browserAutomix.js'
import { getSamplerActions, type SamplerActionsSchema } from './sampler.js'
import { getMasterRecordingActions, type MasterRecordingActionsSchema } from './masterRecording.js'

export type ActionsSchema = TransportActionsSchema &
	MixerActionsSchema &
	LoopsHotcuesActionsSchema &
	EffectsActionsSchema &
	BrowserAutomixActionsSchema &
	SamplerActionsSchema &
	MasterRecordingActionsSchema

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		...getTransportActions(self),
		...getMixerActions(self),
		...getLoopsHotcuesActions(self),
		...getEffectsActions(self),
		...getBrowserAutomixActions(self),
		...getSamplerActions(self),
		...getMasterRecordingActions(self),
	})
}
