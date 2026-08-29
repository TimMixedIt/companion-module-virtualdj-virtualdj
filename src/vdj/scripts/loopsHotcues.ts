import { deckScript } from './common.js'

/**
 * Loop and hot cue VDJScript.
 *
 * Everything in this file is UNCONFIRMED unless noted otherwise: it comes
 * from the official VirtualDJ VDJScript verbs appendix, but this module's
 * authors found no independent corroboration (built-in skin usage, staff
 * forum post, or local HTTP test) for the specific entries below. They are
 * still included - the appendix is a credible primary source on its own -
 * but treat them as needing your own verification pass (see the "check on
 * real hardware" list shipped with this module).
 */

/** UNCONFIRMED. Sets/removes an auto loop of the given beat length (e.g. 4, 8, 16). */
export const loop = (deck: number, beats: number): string => deckScript(deck, `loop ${beats}`)

/** UNCONFIRMED. */
export const loopIn = (deck: number): string => deckScript(deck, 'loop_in')
/** UNCONFIRMED. */
export const loopOut = (deck: number): string => deckScript(deck, 'loop_out')
/** UNCONFIRMED. */
export const loopExit = (deck: number): string => deckScript(deck, 'loop_exit')
/** UNCONFIRMED. */
export const reloop = (deck: number): string => deckScript(deck, 'reloop')
/** UNCONFIRMED. */
export const loopDouble = (deck: number): string => deckScript(deck, 'loop_double')
/** UNCONFIRMED. */
export const loopHalf = (deck: number): string => deckScript(deck, 'loop_half')
/** UNCONFIRMED. Momentary loop roll while held; `beats` such as 0.25/0.5/1/2/4. */
export const loopRoll = (deck: number, beats: number): string => deckScript(deck, `loop_roll ${beats}`)

/** UNCONFIRMED. Current active loop length, or the default loop size when none is active - used as a loop-active feedback. */
export const qActiveLoop = (deck: number): string => deckScript(deck, 'get_active_loop')

/** UNCONFIRMED. Sets/jumps to a numbered hot cue (1-based). Official alias: `hotcue`. */
export const hotCue = (deck: number, slot: number): string => deckScript(deck, `hot_cue ${slot}`)

/** UNCONFIRMED. Jumps to a numbered cue point. */
export const gotoCue = (deck: number, slot: number): string => deckScript(deck, `goto_cue ${slot}`)

/** UNCONFIRMED. Deletes a numbered cue point. */
export const deleteCue = (deck: number, slot: number): string => deckScript(deck, `delete_cue ${slot}`)

/** UNCONFIRMED. Whether the numbered cue point/hot cue slot is set - the feedback for `hotCue`/`gotoCue`. */
export const qHasCue = (deck: number, slot: number): string => deckScript(deck, `has_cue ${slot}`)

/** UNCONFIRMED. The stored color of a cue point, for coloring a hot cue button. */
export const qCueColor = (deck: number, slot: number): string => deckScript(deck, `cue_color ${slot}`)

/** UNCONFIRMED. The stored name of a cue point, for labeling a hot cue button. */
export const qCueName = (deck: number, slot: number): string => deckScript(deck, `cue_name ${slot}`)
