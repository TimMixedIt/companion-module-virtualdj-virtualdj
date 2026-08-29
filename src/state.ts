/** In-memory cache of the last known VirtualDJ state, refreshed by the poller
 * and read synchronously by feedback/variable callbacks. Companion feedback
 * callbacks must return immediately, and the Network Control plugin only
 * offers polling (no push channel), so this cache is the bridge between the
 * two: the poller writes it, everything else only ever reads it.
 */

export const HOTCUE_SLOTS = 8
export const FX_SLOTS = 3
export const SAMPLER_SLOTS = 16

export interface DeckState {
	playing: boolean
	loaded: boolean
	hasError: boolean
	title: string
	artist: string
	bpm: string
	remainingTime: string
	pitch: string
	key: string
	mute: boolean
	pfl: boolean
	eqKillHigh: boolean
	eqKillMid: boolean
	eqKillLow: boolean
	loopActive: boolean
	hotCueSet: boolean[]
	effectActive: boolean[]
	effectName: string[]
	mixfxActive: boolean
}

export interface GlobalState {
	crossfader: number | undefined
	automixActive: boolean
	recording: boolean
	broadcasting: boolean
	recordTime: string
	samplerUsed: boolean
	samplerSlotLoaded: boolean[]
}

export function createDefaultDeckState(): DeckState {
	return {
		playing: false,
		loaded: false,
		hasError: false,
		title: '',
		artist: '',
		bpm: '',
		remainingTime: '',
		pitch: '',
		key: '',
		mute: false,
		pfl: false,
		eqKillHigh: false,
		eqKillMid: false,
		eqKillLow: false,
		loopActive: false,
		hotCueSet: new Array(HOTCUE_SLOTS).fill(false) as boolean[],
		effectActive: new Array(FX_SLOTS).fill(false) as boolean[],
		effectName: new Array(FX_SLOTS).fill('') as string[],
		mixfxActive: false,
	}
}

export function createDefaultGlobalState(): GlobalState {
	return {
		crossfader: undefined,
		automixActive: false,
		recording: false,
		broadcasting: false,
		recordTime: '',
		samplerUsed: false,
		samplerSlotLoaded: new Array(SAMPLER_SLOTS).fill(false) as boolean[],
	}
}

export class VdjState {
	readonly decks = new Map<number, DeckState>()
	global: GlobalState = createDefaultGlobalState()

	getDeck(deck: number): DeckState {
		let state = this.decks.get(deck)
		if (!state) {
			state = createDefaultDeckState()
			this.decks.set(deck, state)
		}
		return state
	}

	ensureDecks(count: number): void {
		for (let i = 1; i <= count; i++) {
			this.getDeck(i)
		}
		for (const deckNum of Array.from(this.decks.keys())) {
			if (deckNum > count) this.decks.delete(deckNum)
		}
	}
}
