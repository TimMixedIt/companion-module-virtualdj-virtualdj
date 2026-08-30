import { deckScript } from './common.js'

/**
 * Transport & deck load/unload VDJScript.
 *
 * Confidence legend used throughout this file and its siblings:
 * - CONFIRMED: verb name and behaviour corroborated by at least two
 *   independent source types (e.g. the official VirtualDJ manual/wiki AND
 *   an independent, reproducible local HTTP test against a running
 *   VirtualDJ instance, or a shipped built-in skin/pad page using it the
 *   same way).
 * - UNCONFIRMED: verb appears in the official VDJScript verbs appendix but
 *   this module's authors found no independent corroboration for it. It is
 *   still included (official docs are a credible source on their own) but
 *   flagged so you know to double check it against your own VirtualDJ build
 *   before relying on it in a show.
 *
 * Full citation trail: docs/VERB_SOURCES.md
 */

/** CONFIRMED - Official appendix + local HTTP test (deck-scoped query flips no->yes after the action). */
export const play = (deck: number): string => deckScript(deck, 'play')

/** CONFIRMED - Official appendix; behaviour corroborated indirectly by observing `play` flip to `no` after it runs. */
export const pause = (deck: number): string => deckScript(deck, 'pause')

/** UNCONFIRMED - Official appendix only. */
export const playPause = (deck: number): string => deckScript(deck, 'play_pause')

/** UNCONFIRMED - Official appendix only. */
export const stop = (deck: number): string => deckScript(deck, 'stop')

/** UNCONFIRMED - Official appendix only. */
export const cue = (deck: number): string => deckScript(deck, 'cue')

/** UNCONFIRMED - Official appendix only. */
export const cuePlay = (deck: number): string => deckScript(deck, 'cue_play')

/** UNCONFIRMED - Official appendix only. */
export const sync = (deck: number): string => deckScript(deck, 'sync')

/** CONFIRMED - Official appendix + confirmed to exist via a live HTTP existence sweep (E_NOTIMPL, action-only). */
export const unload = (deck: number): string => deckScript(deck, 'unload')

/** UNCONFIRMED - Official appendix only. Symmetrical with `load_next`, not itself independently tested. */
export const loadPrevious = (deck: number): string => deckScript(deck, 'load_previous')

/** UNCONFIRMED - Official appendix only. */
export const loadNext = (deck: number): string => deckScript(deck, 'load_next')

/** CONFIRMED - Official appendix + confirmed via a live HTTP existence sweep (E_NOTIMPL, action-only). */
export const browserEnter = (deck: number): string => deckScript(deck, 'browser_enter')

/** Loads an explicit absolute file path onto a deck. CONFIRMED - Official appendix + local HTTP test. */
export const loadPath = (deck: number, absolutePath: string): string =>
	deckScript(deck, `load '${absolutePath.replace(/'/g, "\\'")}'`)

// --- Queries paired with the actions above -------------------------------

/** CONFIRMED - local HTTP test: querying this exact script flips no->yes after `play` runs. */
export const qPlaying = (deck: number): string => deckScript(deck, 'play')

/** CONFIRMED - local HTTP test: querying this exact script flips no->yes after `load_next`/`load` runs. */
export const qLoaded = (deck: number): string => deckScript(deck, 'loaded')

/** CONFIRMED - local HTTP test (Remote Protocol push evidence: pushed on every track load). */
export const qTitle = (deck: number): string => deckScript(deck, 'get_title')

/** CONFIRMED - local HTTP test (Remote Protocol push evidence: pushed on every track load). */
export const qArtist = (deck: number): string => deckScript(deck, 'get_artist')

/** CONFIRMED - local HTTP test (Remote Protocol push evidence: pushed on every track load). */
export const qBpm = (deck: number): string => deckScript(deck, 'get_bpm')

/** UNCONFIRMED - Official appendix only. */
export const qKey = (deck: number): string => deckScript(deck, "get_key 'musical'")

/** UNCONFIRMED - Official appendix only. */
export const qPitch = (deck: number): string => deckScript(deck, 'get_pitch_value')

/** UNCONFIRMED - Official appendix only. `'remain'` selects remaining (vs. elapsed/total) time; per
 * the manual, `get_time` always returns **milliseconds** regardless of arguments - it does not
 * pre-format the value, so callers (see `src/vdj/parse.ts#formatMsAsClock`) format it themselves. */
export const qRemainingTime = (deck: number): string => deckScript(deck, `get_time 'remain'`)

/** CONFIRMED - Official appendix; local testing (deck_has_error dedicated pad fixture, see VERB_SOURCES.md). */
export const qDeckHasError = (deck: number): string => deckScript(deck, 'deck_has_error')
