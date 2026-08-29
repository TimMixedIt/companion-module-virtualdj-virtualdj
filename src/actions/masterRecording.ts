import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import * as master from '../vdj/scripts/masterRecording.js'

export type MasterRecordingActionsSchema = {
	record_toggle: { options: Record<string, never> }
	broadcast_toggle: { options: Record<string, never> }
	broadcast_message: { options: { message: string } }
}

export function getMasterRecordingActions(
	self: ModuleInstance,
): CompanionActionDefinitions<MasterRecordingActionsSchema> {
	return {
		record_toggle: {
			name: 'Recording: Start/Stop',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [],
			callback: async () => {
				await self.vdj.execute(master.record())
			},
		},
		broadcast_toggle: {
			name: 'Broadcast: Start/Stop',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [],
			callback: async () => {
				await self.vdj.execute(master.broadcast())
			},
		},
		broadcast_message: {
			name: 'Broadcast: Set Message',
			description: 'UNCONFIRMED verb (see docs/VERB_SOURCES.md).',
			options: [{ type: 'textinput', id: 'message', label: 'Message', default: '', useVariables: true }],
			callback: async (event) => {
				await self.vdj.execute(master.broadcastMessage(event.options.message))
			},
		},
	}
}
