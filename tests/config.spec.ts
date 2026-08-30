import { describe, expect, it } from 'vitest'
import { GetConfigFields } from '../src/config.js'

/** Companion's own Regex.* constants are full "/pattern/flags" strings; this mirrors how
 * Companion parses a config field's `regex` for validation, so a test here catches the same
 * class of bug a naive string-concatenation of two of those constants caused in production
 * (see git history: `${Regex.IP}|${Regex.HOSTNAME}` broke validation for plain IPs). */
function toRegExp(regexLiteral: string): RegExp {
	const match = /^\/(.*)\/([a-z]*)$/.exec(regexLiteral)
	if (!match) throw new Error(`Not a delimited regex literal: ${regexLiteral}`)
	return new RegExp(match[1], match[2])
}

describe('connection config fields', () => {
	it('accepts plain IPv4 addresses and hostnames for the host field', () => {
		const hostField = GetConfigFields().find((f) => f.id === 'host')
		expect(hostField).toBeDefined()
		if (!hostField || !('regex' in hostField) || !hostField.regex) {
			throw new Error('host field has no regex')
		}
		const re = toRegExp(hostField.regex)

		for (const valid of ['127.0.0.1', '192.168.1.50', 'localhost', 'virtualdj.local', 'my-laptop']) {
			expect(re.test(valid), `expected ${valid} to be accepted`).toBe(true)
		}
		for (const invalid of ['', 'http://127.0.0.1', '127.0.0.1:80', 'not a host']) {
			expect(re.test(invalid), `expected ${invalid} to be rejected`).toBe(false)
		}
	})
})
