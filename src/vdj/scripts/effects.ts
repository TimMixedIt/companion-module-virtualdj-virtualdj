import { deckScript, pct, quote } from './common.js'

/** Effects VDJScript (deck FX slots 1-3 and Mix FX). See docs/VERB_SOURCES.md. */

/** CONFIRMED - Official appendix + Official forum + Community + local HTTP/pad test evidence. */
export const effectActive = (deck: number, slot: number, on: boolean): string =>
	deckScript(deck, `effect_active ${slot} ${on ? 'on' : 'off'}`)
export const qEffectActive = (deck: number, slot: number): string => deckScript(deck, `effect_active ${slot}`)

/** CONFIRMED - Official appendix; used directly inside an independently reproduced local pad-page test pattern. */
export const effectSelect = (deck: number, slot: number, effectName: string): string =>
	deckScript(deck, `effect_select ${slot} ${quote(effectName)}`)

/** UNCONFIRMED - Official appendix only. `paramIndex` is 1-based within the effect. */
export const effectSlider = (deck: number, slot: number, paramIndex: number, position0to100: number): string =>
	deckScript(deck, `effect_slider ${slot} ${paramIndex} ${pct(position0to100)}`)

/** CONFIRMED - reproduced locally against a live VirtualDJ install (matched the GUI's selected effect name). */
export const qEffectName = (deck: number, slot: number): string => deckScript(deck, `get_effect_name ${slot}`)

/** CONFIRMED - reproduced locally (mirrors `effect_mixfx_activate` while switching between Filter/Echo). */
export const effectMixfxActivate = (deck: number): string => deckScript(deck, 'effect_mixfx_activate')
export const qMixfxActive = (deck: number): string => deckScript(deck, 'get_mixfx_active')

/** CONFIRMED - reproduced locally: direct and indirect selected-state queries confirmed working. */
export const effectMixfxSelect = (deck: number, effectName: string): string =>
	deckScript(deck, `effect_mixfx_select ${quote(effectName)}`)

/** UNCONFIRMED - Official appendix only. Broad reset of temporary Pad FX. */
export const effectDisableAllPadFx = (deck: number): string => deckScript(deck, "effect_disable_all 'padfx'")
