import type ModuleInstance from '../main.js'
import { getTransportFeedbacks, type TransportFeedbacksSchema } from './transport.js'
import { getMixerFeedbacks, type MixerFeedbacksSchema } from './mixer.js'
import { getLoopsHotcuesFeedbacks, type LoopsHotcuesFeedbacksSchema } from './loopsHotcues.js'
import { getEffectsFeedbacks, type EffectsFeedbacksSchema } from './effects.js'
import { getBrowserAutomixFeedbacks, type BrowserAutomixFeedbacksSchema } from './browserAutomix.js'
import { getSamplerFeedbacks, type SamplerFeedbacksSchema } from './sampler.js'
import { getMasterRecordingFeedbacks, type MasterRecordingFeedbacksSchema } from './masterRecording.js'

export type FeedbacksSchema = TransportFeedbacksSchema &
	MixerFeedbacksSchema &
	LoopsHotcuesFeedbacksSchema &
	EffectsFeedbacksSchema &
	BrowserAutomixFeedbacksSchema &
	SamplerFeedbacksSchema &
	MasterRecordingFeedbacksSchema

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		...getTransportFeedbacks(self),
		...getMixerFeedbacks(self),
		...getLoopsHotcuesFeedbacks(self),
		...getEffectsFeedbacks(self),
		...getBrowserAutomixFeedbacks(self),
		...getSamplerFeedbacks(self),
		...getMasterRecordingFeedbacks(self),
	})
}
