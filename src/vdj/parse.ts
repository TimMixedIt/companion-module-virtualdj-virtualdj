/**
 * Helpers for interpreting the plain-text bodies returned by the Network
 * Control plugin. VDJScript queries are typed internally (bool/int/float/
 * text) but the HTTP interface flattens everything to text, so callers have
 * to recover the type by convention. Observed boolean spellings across the
 * verbs this module uses include "true"/"false", "yes"/"no" and "on"/"off"
 * (see docs/VERB_SOURCES.md), so `parseVdjBoolean` accepts all of them.
 */

const TRUTHY = new Set(['true', 'yes', 'on', '1'])
const FALSY = new Set(['false', 'no', 'off', '0'])

/** A query that failed to evaluate returns `error:<HRESULT>` with HTTP 200. */
export function isVdjErrorBody(body: string): boolean {
	return /^error:-?\d+$/.test(body.trim())
}

/** Best-effort boolean parse of a query/execute body. Unknown/error bodies parse as `false`. */
export function parseVdjBoolean(body: string | undefined): boolean {
	if (body === undefined) return false
	const normalized = body.trim().toLowerCase()
	if (TRUTHY.has(normalized)) return true
	if (FALSY.has(normalized)) return false
	return false
}

/** Text value for variables: an error body or missing value renders as an empty string. */
export function parseVdjText(body: string | undefined): string {
	if (body === undefined) return ''
	if (isVdjErrorBody(body)) return ''
	return body.trim()
}

/** Numeric value for variables/feedback comparisons; error bodies and NaN collapse to `undefined`. */
export function parseVdjNumber(body: string | undefined): number | undefined {
	if (body === undefined) return undefined
	if (isVdjErrorBody(body)) return undefined
	const trimmed = body.trim().replace('%', '')
	const value = Number(trimmed)
	return Number.isFinite(value) ? value : undefined
}
