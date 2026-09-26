import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { encodePngRgb, pitchDeviationPercent, renderPitchBarPng64, renderPitchBarRgb } from '../src/pitchBar.js'

const GREEN = 0x00aa00
const RED = 0xc80000
const base = { width: 4, height: 20, rangePercent: 8, fasterColor: GREEN, slowerColor: RED, fasterIsUp: false }

/** Colour of the first pixel in row `y`. */
function rowColor(rgb: Buffer, width: number, y: number): number {
	const i = y * width * 3
	return (rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2]
}

describe('pitchDeviationPercent', () => {
	it('accepts 100-based and relative readings', () => {
		expect(pitchDeviationPercent('102.5')).toBeCloseTo(2.5)
		expect(pitchDeviationPercent('97')).toBeCloseTo(-3)
		expect(pitchDeviationPercent('+2.5')).toBeCloseTo(2.5)
		expect(pitchDeviationPercent('-4%')).toBeCloseTo(-4)
		expect(pitchDeviationPercent('')).toBeUndefined()
	})
})

describe('renderPitchBarRgb', () => {
	it('draws faster downwards by default, like the VirtualDJ pitch fader', () => {
		const rgb = renderPitchBarRgb({ ...base, deviation: 4 })
		expect(rowColor(rgb, 4, 2)).toBe(0x000000) // above centre stays black
		expect(rowColor(rgb, 4, 13)).toBe(GREEN) // half range -> half of the lower half
		expect(rowColor(rgb, 4, 19)).toBe(0x000000)
	})

	it('draws slower upwards, and flips with fasterIsUp', () => {
		const slower = renderPitchBarRgb({ ...base, deviation: -8 })
		expect(rowColor(slower, 4, 0)).toBe(RED)
		expect(rowColor(slower, 4, 15)).toBe(0x000000)

		const fasterUp = renderPitchBarRgb({ ...base, deviation: 8, fasterIsUp: true })
		expect(rowColor(fasterUp, 4, 0)).toBe(GREEN)
	})

	it('shows only black and the centre line at original tempo', () => {
		const rgb = renderPitchBarRgb({ ...base, deviation: 0 })
		expect(rowColor(rgb, 4, 5)).toBe(0x000000)
		expect(rowColor(rgb, 4, 10)).toBe(0x505050)
		expect(rowColor(rgb, 4, 15)).toBe(0x000000)
	})
})

describe('encodePngRgb', () => {
	it('produces a PNG whose pixel data round-trips', () => {
		const rgb = renderPitchBarRgb({ ...base, deviation: 3 })
		const png = encodePngRgb(4, 20, rgb)
		expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
		const idatStart = png.indexOf('IDAT') + 4
		const idatLength = png.readUInt32BE(idatStart - 8)
		const raw = inflateSync(png.subarray(idatStart, idatStart + idatLength))
		expect(raw.length).toBe((4 * 3 + 1) * 20)
		expect(raw.subarray(1 + 13 * 13, 13 + 13 * 13)).toEqual(rgb.subarray(13 * 12, 14 * 12))
	})

	it('renderPitchBarPng64 returns base64 PNG data', () => {
		const png64 = renderPitchBarPng64({ ...base, width: 72, height: 72, deviation: 1 })
		expect(Buffer.from(png64, 'base64').subarray(1, 4).toString()).toBe('PNG')
	})
})
