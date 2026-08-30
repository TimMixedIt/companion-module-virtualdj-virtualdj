import type {
	CompanionActionDefinitions,
	CompanionFeedbackDefinitions,
	CompanionPresetDefinitions,
	CompanionPresetSection,
	CompanionVariableDefinitions,
	CompanionVariableValues,
	InstanceStatus,
} from '@companion-module/base'
import ModuleInstance, { type ModuleSchema } from '../src/main.js'
import type { ModuleConfig } from '../src/config.js'

/**
 * Builds a fake host-side "instance context" satisfying
 * `@companion-module/base`'s `isInstanceContext` check, so the real
 * `ModuleInstance` class can be instantiated and driven directly in tests -
 * without a running Companion host. Every call the module makes into the
 * host is recorded here instead of being sent anywhere.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- inline object type, see FakeContext below
export function createFakeContext() {
	const record = {
		id: 'test-instance',
		label: 'test',
		_isInstanceContext: true as const,
		statusUpdates: [] as { status: InstanceStatus; message: string | null }[],
		actionDefinitions: undefined as CompanionActionDefinitions<ModuleSchema['actions']> | undefined,
		feedbackDefinitions: undefined as CompanionFeedbackDefinitions<ModuleSchema['feedbacks']> | undefined,
		variableDefinitions: undefined as CompanionVariableDefinitions<ModuleSchema['variables']> | undefined,
		variableValues: {} as CompanionVariableValues,
		presetStructure: undefined as CompanionPresetSection<ModuleSchema>[] | undefined,
		presetDefinitions: undefined as CompanionPresetDefinitions<ModuleSchema> | undefined,
		checkAllFeedbacksCallCount: 0,

		upgradeScripts: [],
		saveConfig: () => {
			/* no-op */
		},
		updateStatus(status: InstanceStatus, message: string | null) {
			record.statusUpdates.push({ status, message })
		},
		oscSend: () => {
			/* no-op */
		},
		recordAction: () => {
			/* no-op */
		},
		setActionDefinitions: (actions: CompanionActionDefinitions<ModuleSchema['actions']>) => {
			record.actionDefinitions = actions
		},
		subscribeActions: () => {
			/* no-op */
		},
		unsubscribeActions: () => {
			/* no-op */
		},
		setFeedbackDefinitions: (feedbacks: CompanionFeedbackDefinitions<ModuleSchema['feedbacks']>) => {
			record.feedbackDefinitions = feedbacks
		},
		unsubscribeFeedbacks: () => {
			/* no-op */
		},
		checkFeedbacks: () => {
			/* no-op */
		},
		checkAllFeedbacks: () => {
			record.checkAllFeedbacksCallCount++
		},
		checkFeedbacksById: () => {
			/* no-op */
		},
		setPresetDefinitions: (
			structure: CompanionPresetSection<ModuleSchema>[],
			presets: CompanionPresetDefinitions<ModuleSchema>,
		) => {
			record.presetStructure = structure
			record.presetDefinitions = presets
		},
		setVariableDefinitions: (variables: CompanionVariableDefinitions<ModuleSchema['variables']>) => {
			record.variableDefinitions = variables
		},
		setVariableValues: (values: Partial<CompanionVariableValues>) => {
			Object.assign(record.variableValues, values)
		},
		getVariableValue: <T extends string>(id: T) => record.variableValues[id],
		sharedUdpSocketHandlers: new Map(),
		sharedUdpSocketJoin: async () => '',
		sharedUdpSocketLeave: async () => {
			/* no-op */
		},
		sharedUdpSocketSend: async () => {
			/* no-op */
		},
	}
	return record
}

export type FakeContext = ReturnType<typeof createFakeContext>

/** Minimal `CompanionActionContext` for driving an action callback directly in a test. */
export const fakeActionContext = {
	type: 'action' as const,
	setCustomVariableValue: (): void => {
		/* no-op */
	},
}

/** Narrows a `setActionDefinitions`/`setFeedbackDefinitions` entry (typed as `T | false | undefined`
 * because a module may disable a definition) down to `T` for test assertions, throwing with a useful
 * message if the definition wasn't registered at all - which is itself a real assertion failure. */
export function must<T>(value: T | false | undefined, message: string): T {
	if (value === false || value === undefined) throw new Error(message)
	return value
}

/** Instantiates the real ModuleInstance against a fake host context. Call `instance.init(config)` next. */
export function createModuleInstance(): { instance: ModuleInstance; context: FakeContext } {
	const context = createFakeContext()
	const instance = new ModuleInstance(context)
	return { instance, context }
}

export function defaultTestConfig(overrides: Partial<ModuleConfig> = {}): ModuleConfig {
	return {
		host: '127.0.0.1',
		port: 8080,
		bearerToken: '',
		pollIntervalMs: 50,
		decks: 2,
		...overrides,
	}
}
