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

/** Numeric value for variables/feedback comparisons; error bodies, empty bodies and NaN collapse to
 * `undefined` (not 0 - `Number('')` is 0 in JS, which would otherwise make an empty/no-track-loaded
 * response look identical to a real zero reading). */
export function parseVdjNumber(body: string | undefined): number | undefined {
	if (body === undefined) return undefined
	if (isVdjErrorBody(body)) return undefined
	const trimmed = body.trim().replace('%', '')
	if (trimmed === '') return undefined
	const value = Number(trimmed)
	return Number.isFinite(value) ? value : undefined
}

/** Formats a millisecond duration as `m:ss`, or `h:mm:ss` once it reaches an hour. `get_time` (see
 * docs/VERB_SOURCES.md) returns milliseconds regardless of its arguments - VirtualDJ does not format
 * this for us, so the module does it here rather than displaying a raw millisecond count. */
export function formatMsAsClock(ms: number | undefined): string {
	if (ms === undefined || !Number.isFinite(ms) || ms < 0) return ''
	const totalSeconds = Math.floor(ms / 1000)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const seconds = totalSeconds % 60
	const pad = (n: number): string => String(n).padStart(2, '0')
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

/** For "*_time"-shaped verbs whose return format isn't independently confirmed (see
 * docs/VERB_SOURCES.md): `get_time` is confirmed to return raw milliseconds, but for verbs like
 * `get_record_time` this module has no independent confirmation either way. Rather than guess and
 * risk reformatting an already-human-readable string into garbage, this detects the shape at
 * runtime: a bare number is treated as milliseconds and formatted as a clock; anything else
 * (already containing ":" or other characters) is trusted as pre-formatted and passed through
 * unchanged. */
export function formatVdjTimeLikeValue(body: string | undefined): string {
	const text = parseVdjText(body)
	if (!text) return ''
	return /^\d+(\.\d+)?$/.test(text) ? formatMsAsClock(Number(text)) : text
}
