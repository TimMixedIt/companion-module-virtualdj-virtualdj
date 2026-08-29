/**
 * Shared VDJScript building blocks.
 *
 * Deck scoping (`deck <n> <verb>`) - CONFIRMED. Official: documented throughout
 * the VDJScript verbs appendix ("Deck Specification"). Independently
 * reproduced against a live VirtualDJ 2026 install: sending `deck 1 play` and
 * `deck 2 load_next` as actions, then reading back `deck 1 play` / `deck 2
 * loaded` over /query, changed from the expected before-state to the
 * expected after-state (see docs/VERB_SOURCES.md#deck-scoping).
 */
export function deckScript(deck: number, verb: string): string {
	return `deck ${deck} ${verb}`
}

/** Percentage literal, e.g. `50%`. VDJScript accepts plain integer percentages for sliders/faders. */
export function pct(value: number): string {
	return `${Math.round(value)}%`
}

/** Quote a free-text argument for VDJScript (single-quoted string literal). */
export function quote(value: string): string {
	return `'${value.replace(/'/g, "\\'")}'`
}
