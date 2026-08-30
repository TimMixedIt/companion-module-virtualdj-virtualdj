import { describe, expect, it } from 'vitest'
import * as transport from '../src/vdj/scripts/transport.js'
import * as mixer from '../src/vdj/scripts/mixer.js'
import * as loops from '../src/vdj/scripts/loopsHotcues.js'
import * as effects from '../src/vdj/scripts/effects.js'
import {
	parseVdjBoolean,
	parseVdjText,
	parseVdjNumber,
	isVdjErrorBody,
	formatMsAsClock,
	formatVdjTimeLikeValue,
} from '../src/vdj/parse.js'

describe('VDJScript builders', () => {
	it('scopes verbs to a deck', () => {
		expect(transport.play(1)).toBe('deck 1 play')
		expect(transport.pause(3)).toBe('deck 3 pause')
	})

	it('builds percentage-based mixer scripts', () => {
		expect(mixer.crossfader(50)).toBe('crossfader 50%')
		expect(mixer.eqHigh(2, 75)).toBe('deck 2 eq_high 75%')
	})

	it('builds loop/hotcue scripts with numeric args', () => {
		expect(loops.loop(1, 8)).toBe('deck 1 loop 8')
		expect(loops.hotCue(1, 3)).toBe('deck 1 hot_cue 3')
		expect(loops.qHasCue(1, 3)).toBe('deck 1 has_cue 3')
	})

	it('quotes string arguments for effect selection', () => {
		expect(effects.effectSelect(1, 2, 'Echo')).toBe(`deck 1 effect_select 2 'Echo'`)
	})
})

describe('response parsing', () => {
	it('accepts every observed boolean spelling', () => {
		for (const truthy of ['true', 'yes', 'on', '1', 'TRUE', ' Yes ']) {
			expect(parseVdjBoolean(truthy)).toBe(true)
		}
		for (const falsy of ['false', 'no', 'off', '0', undefined, '', 'error:-2147467259']) {
			expect(parseVdjBoolean(falsy)).toBe(false)
		}
	})

	it('detects error bodies', () => {
		expect(isVdjErrorBody('error:-2147467259')).toBe(true)
		expect(isVdjErrorBody('Body Lang')).toBe(false)
	})

	it('renders error bodies as empty text', () => {
		expect(parseVdjText('error:-2147024809')).toBe('')
		expect(parseVdjText('Body Lang')).toBe('Body Lang')
		expect(parseVdjText(undefined)).toBe('')
	})

	it('parses numbers and tolerates percent signs', () => {
		expect(parseVdjNumber('127.999')).toBe(127.999)
		expect(parseVdjNumber('50%')).toBe(50)
		expect(parseVdjNumber('error:-2147467259')).toBeUndefined()
		expect(parseVdjNumber('not a number')).toBeUndefined()
	})

	it('does not treat an empty body as the number zero', () => {
		// Number('') === 0 in JS - parseVdjNumber must not fall into that trap, or an
		// empty/no-track-loaded response would look identical to a real zero reading.
		expect(parseVdjNumber('')).toBeUndefined()
		expect(parseVdjNumber('   ')).toBeUndefined()
	})

	it('formats a millisecond duration as a clock string', () => {
		expect(formatMsAsClock(0)).toBe('0:00')
		expect(formatMsAsClock(8000)).toBe('0:08')
		expect(formatMsAsClock(188307)).toBe('3:08')
		expect(formatMsAsClock(3_661_000)).toBe('1:01:01') // past an hour
		expect(formatMsAsClock(undefined)).toBe('')
		expect(formatMsAsClock(-5)).toBe('')
	})

	it('formats a bare-number time-like value as a clock, but leaves already-formatted text alone', () => {
		// get_time is confirmed to return raw milliseconds (see docs/VERB_SOURCES.md); other
		// "*_time" verbs (e.g. get_record_time) aren't independently confirmed either way, so
		// this only reformats what looks like a bare number and trusts anything else.
		expect(formatVdjTimeLikeValue('188307')).toBe('3:08')
		expect(formatVdjTimeLikeValue('01:23:45')).toBe('01:23:45')
		expect(formatVdjTimeLikeValue('')).toBe('')
		expect(formatVdjTimeLikeValue(undefined)).toBe('')
		expect(formatVdjTimeLikeValue('error:-2147467259')).toBe('')
	})
})
