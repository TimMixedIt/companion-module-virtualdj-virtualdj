import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, DEFAULT_POLL_INTERVAL_MS, MIN_POLL_INTERVAL_MS } from './config.js'
import { UpdateVariableDefinitions, refreshVariableValues, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions/index.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks/index.js'
import { UpdatePresets } from './presets.js'
import { VdjClient, type VdjFailure } from './vdj/client.js'
import { VdjState } from './state.js'
import { Poller } from './poller.js'
import { buildPollJobs } from './jobs.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()
	vdj!: VdjClient // Setup in init()
	readonly state = new VdjState()

	private poller: Poller | undefined

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.state.ensureDecks(this.config.decks)
		this.vdj = new VdjClient(this.buildClientOptions())

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()

		this.startPoller()
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.poller?.stop()
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		const deckCountChanged = config.decks !== this.config?.decks
		this.config = config
		this.state.ensureDecks(this.config.decks)
		this.vdj.updateOptions(this.buildClientOptions())

		if (deckCountChanged) {
			// Deck-scoped dropdown choices (actions/feedbacks/presets) and per-deck
			// variables all depend on the configured deck count, so rebuild them.
			this.updateActions()
			this.updateFeedbacks()
			this.updatePresets()
			this.updateVariableDefinitions()
		}

		this.startPoller()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	/** Clamp a deck number coming from an action/feedback option to the currently configured deck range,
	 * in case a button was configured before the deck count was lowered. */
	clampDeck(deck: number): number {
		const max = Math.max(1, this.config.decks)
		return Math.min(Math.max(1, Math.round(deck)), max)
	}

	private buildClientOptions(): { host: string; port: number; bearerToken?: string } {
		return {
			host: this.config.host,
			port: this.config.port,
			bearerToken: this.config.bearerToken || undefined,
		}
	}

	private startPoller(): void {
		this.poller?.stop()
		this.poller = new Poller({
			client: this.vdj,
			state: this.state,
			getIntervalMs: () => Math.max(MIN_POLL_INTERVAL_MS, this.config.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS),
			buildJobs: () => buildPollJobs(this.config.decks),
			onConnectionOk: () => {
				this.updateStatus(InstanceStatus.Ok)
			},
			onConnectionFailure: (failure) => {
				this.applyConnectionFailure(failure)
			},
			onPassComplete: () => {
				refreshVariableValues(this)
				this.checkAllFeedbacks()
			},
			log: (level, message) => this.log(level, message),
		})
		this.poller.start()
	}

	private applyConnectionFailure(failure: VdjFailure): void {
		switch (failure.reason) {
			case 'auth':
				this.updateStatus(InstanceStatus.AuthenticationFailure, failure.message)
				break
			case 'timeout':
			case 'network':
				this.updateStatus(InstanceStatus.ConnectionFailure, failure.message)
				break
			case 'http':
			default:
				this.updateStatus(InstanceStatus.UnknownError, failure.message)
				break
		}
		this.log('warn', failure.message)
	}
}
