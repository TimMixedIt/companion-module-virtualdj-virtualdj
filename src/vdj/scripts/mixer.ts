import { deckScript, pct } from './common.js'

/**
 * Mixer VDJScript: levels, mute/PFL, EQ, crossfader.
 * See docs/VERB_SOURCES.md for the full citation trail.
 */

/** CONFIRMED - Official appendix + local HTTP test (`crossfader 100%` moved it, bare query read it back). */
export const crossfader = (position0to100: number): string => `crossfader ${pct(position0to100)}`

/** CONFIRMED - same evidence as `crossfader` (bare form is the query). */
export const qCrossfader = (): string => 'crossfader'

/** UNCONFIRMED - Official appendix only. */
export const volume = (deck: number, level0to100: number): string => deckScript(deck, `volume ${pct(level0to100)}`)

/** UNCONFIRMED - Official appendix only. */
export const gain = (deck: number, level0to100: number): string => deckScript(deck, `gain ${pct(level0to100)}`)

/** UNCONFIRMED - Official appendix only. Query-capability of `mute` itself is not independently confirmed either;
 * verify against a real VirtualDJ build before relying on the paired feedback in a show. */
export const mute = (deck: number): string => deckScript(deck, 'mute')
export const qMute = (deck: number): string => deckScript(deck, 'mute')

/** UNCONFIRMED - Official appendix only ("Send to headphones"). Query-capability not independently confirmed. */
export const pfl = (deck: number): string => deckScript(deck, 'pfl')
export const qPfl = (deck: number): string => deckScript(deck, 'pfl')

/** CONFIRMED - Official appendix + Built-in skin evidence (shipped skins bind this to a center-origin slider). */
export const eqHigh = (deck: number, position0to100: number): string =>
	deckScript(deck, `eq_high ${pct(position0to100)}`)
/** CONFIRMED - Official appendix + Built-in skin evidence. */
export const eqMid = (deck: number, position0to100: number): string => deckScript(deck, `eq_mid ${pct(position0to100)}`)
/** CONFIRMED - Official appendix + Built-in skin evidence. */
export const eqLow = (deck: number, position0to100: number): string => deckScript(deck, `eq_low ${pct(position0to100)}`)

/** CONFIRMED - Official appendix + Built-in skin evidence (shipped skins use `action="eq_kill_high" query="eq_kill_high"` verbatim). */
export const eqKillHigh = (deck: number): string => deckScript(deck, 'eq_kill_high')
export const qEqKillHigh = (deck: number): string => deckScript(deck, 'eq_kill_high')

/** CONFIRMED - same class of evidence as `eq_kill_high`. */
export const eqKillMid = (deck: number): string => deckScript(deck, 'eq_kill_mid')
export const qEqKillMid = (deck: number): string => deckScript(deck, 'eq_kill_mid')

/** CONFIRMED - same class of evidence as `eq_kill_high`. */
export const eqKillLow = (deck: number): string => deckScript(deck, 'eq_kill_low')
export const qEqKillLow = (deck: number): string => deckScript(deck, 'eq_kill_low')

/** UNCONFIRMED - Official appendix only. */
export const masterVolume = (level0to100: number): string => `master_volume ${pct(level0to100)}`

/** UNCONFIRMED - Official appendix only. */
export const boothVolume = (level0to100: number): string => `booth_volume ${pct(level0to100)}`

/** UNCONFIRMED - Official appendix only. */
export const headphoneVolume = (level0to100: number): string => `headphone_volume ${pct(level0to100)}`

/** UNCONFIRMED - Official appendix only. */
export const headphoneMix = (position0to100: number): string => `headphone_mix ${pct(position0to100)}`

/** UNCONFIRMED - Official appendix only. Assigns a deck to a crossfader side ('left' | 'right' | 'thru'). */
export const crossAssign = (deck: number, side: 'left' | 'right' | 'thru'): string =>
	deckScript(deck, `cross_assign '${side}'`)

/** UNCONFIRMED - Official appendix only. */
export const qMasterVolume = (): string => 'master_volume'

/** UNCONFIRMED - Official appendix only. Overall output level, useful as a bar-style feedback. */
export const qLevel = (deck: number): string => deckScript(deck, 'get_level')
