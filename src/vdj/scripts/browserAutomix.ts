import { deckScript, quote } from './common.js'

/** Browser & Automix VDJScript. See docs/VERB_SOURCES.md. */

/** UNCONFIRMED - Official appendix only. Direction is +1/-1. */
export const browserScroll = (steps: number): string => `browser_scroll ${steps > 0 ? '+' : ''}${steps}`

/** CONFIRMED - Official appendix + independently observed in a published third-party VirtualDJ skin using it the same way. */
export const search = (text: string): string => `search ${quote(text)}`

/** UNCONFIRMED - Official appendix only. */
export const clearSearch = (): string => 'clear_search'

/** UNCONFIRMED - Official appendix only. Starts/stops Automix. */
export const automix = (): string => 'automix'

/** UNCONFIRMED - Official appendix only. */
export const automixSkip = (): string => 'automix_skip'

/** UNCONFIRMED - Official appendix only. */
export const qAutomix = (): string => 'get_automix'

/** UNCONFIRMED - Official appendix only. Crossfades with sync to the next/selected track. `durationMs` e.g. 4000. */
export const mixNow = (durationMs: number): string => `mix_now ${durationMs}ms`

/** UNCONFIRMED - Official appendix only. Adds the currently browsed/selected songs to the Automix playlist. */
export const playlistAdd = (): string => 'playlist_add'

/** UNCONFIRMED - Official appendix only. Loads the currently selected/browsed song onto a deck. Alias of load w/o path. */
export const loadSelected = (deck: number): string => deckScript(deck, 'load')
