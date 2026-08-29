/** Sampler VDJScript. See docs/VERB_SOURCES.md. */

/** UNCONFIRMED - Official appendix only. Absolute sample slot number. */
export const samplerPlay = (slot: number): string => `sampler_play ${slot}`

/** UNCONFIRMED - Official appendix only. */
export const samplerStop = (slot: number): string => `sampler_stop ${slot}`

/** UNCONFIRMED - Official appendix only. Stops every currently playing sample. */
export const samplerStopAll = (): string => 'sampler_stop all'

/** UNCONFIRMED - Official appendix only. Triggers the currently visible pad in the active sampler page. */
export const samplerPad = (visiblePad: number): string => `sampler_pad ${visiblePad}`

/** CONFIRMED - local pad/skin testing observed this returning the active 8-pad window (e.g. "1 to 8", "9 to 16"). */
export const samplerPadPage = (steps: number): string => `sampler_pad_page ${steps > 0 ? '+' : ''}${steps}`

/** CONFIRMED - explicitly recommended and locally validated as the correct absolute-slot visibility/loaded check. */
export const qSamplerLoaded = (absoluteSlot: number): string => `sampler_loaded ${absoluteSlot}`

/** UNCONFIRMED - Official appendix only. */
export const samplerBank = (steps: number): string => `sampler_bank ${steps > 0 ? '+' : ''}${steps}`

/** UNCONFIRMED - Official appendix only. */
export const qSamplerBank = (): string => 'get_sampler_bank'

/** UNCONFIRMED - Official appendix only ("check whether any sample ... is playing"). */
export const qSamplerUsed = (): string => 'sampler_used'
