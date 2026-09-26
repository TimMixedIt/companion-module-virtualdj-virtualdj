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
	/** Deck currently considered "on air" - see {@link pickActiveDeck}. Sticky: keeps the last value while nothing plays. */
	activeDeck: number
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
		activeDeck: 1,
		automixActive: false,
		recording: false,
		broadcasting: false,
		recordTime: '',
		samplerUsed: false,
		samplerSlotLoaded: new Array(SAMPLER_SLOTS).fill(false) as boolean[],
	}
}

/**
 * Decides which deck is "on air", so a single button can show the BPM/title of
 * whatever is actually playing instead of a fixed deck:
 * - exactly one deck playing -> that deck
 * - several playing (mid-transition) -> the side the crossfader leans towards
 *   (odd decks = left, even decks = right, VirtualDJ's default assignment);
 *   with the crossfader centred, keep the previous deck if it is still playing
 * - nothing playing -> keep the previous deck so the display doesn't blank out
 */
export function pickActiveDeck(playing: boolean[], crossfader: number | undefined, previous: number): number {
	const playingDecks = playing.flatMap((isPlaying, i) => (isPlaying ? [i + 1] : []))
	if (playingDecks.length === 0) return previous <= playing.length ? previous : 1
	if (playingDecks.length === 1) return playingDecks[0]

	if (crossfader !== undefined && crossfader !== 50) {
		const wantEven = crossfader > 50
		const sameSide = playingDecks.filter((deck) => (deck % 2 === 0) === wantEven)
		if (sameSide.includes(previous)) return previous
		if (sameSide.length > 0) return sameSide[0]
	}
	return playingDecks.includes(previous) ? previous : playingDecks[0]
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

	/** Recomputes {@link GlobalState.activeDeck} from the cached playing/crossfader state. */
	updateActiveDeck(deckCount: number): number {
		const playing: boolean[] = []
		for (let deck = 1; deck <= deckCount; deck++) playing.push(this.getDeck(deck).playing)
		this.global.activeDeck = pickActiveDeck(playing, this.global.crossfader, this.global.activeDeck)
		return this.global.activeDeck
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
