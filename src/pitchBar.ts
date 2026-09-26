import { crc32, deflateSync } from 'node:zlib'
import { parseVdjNumber } from './vdj/parse.js'

/**
 * Pitch bar graphic for the "Deck Pitch Bar" feedback: a black background
 * with a thin centre line and a bar growing from the centre like a pitch
 * fader - by default down when the track plays faster than its original
 * tempo and up when slower, matching VirtualDJ's fader. Drawn by the module as a small PNG (no image library needed)
 * and handed to Companion as `png64`, so it sits behind the button text.
 */

/**
 * Converts the raw `get_pitch_value` reading into a signed deviation in percent
 * (+2.5 = 2.5% faster). `get_pitch_value` is UNCONFIRMED (see docs/VERB_SOURCES.md):
 * it may report 100-based (`102.5`) or relative (`+2.5`), so both are accepted -
 * anything >= 50 is treated as 100-based, since no pitch range goes that far.
 */
export function pitchDeviationPercent(raw: string | undefined): number | undefined {
	const value = parseVdjNumber(raw)
	if (value === undefined) return undefined
	return value >= 50 ? value - 100 : value
}

export interface PitchBarOptions {
	width: number
	height: number
	/** Signed deviation in percent; undefined draws only the centre line. */
	deviation: number | undefined
	/** Deviation (in percent) that fills the bar all the way to the edge. */
	rangePercent: number
	/** Colours as 0xRRGGBB. */
	fasterColor: number
	slowerColor: number
	/** true: faster grows upwards; false: faster grows downwards, like VirtualDJ's pitch fader. */
	fasterIsUp: boolean
	/** Leave the background transparent so the button's own background colour (e.g. a "playing" colour) shows through. */
	transparentBackground?: boolean
}

const BACKGROUND = 0x000000
const CENTER_LINE = 0x505050

/** Renders the bar as 8-bit RGBA pixels (4 bytes per pixel). */
export function renderPitchBarRgba(opts: PitchBarOptions): Buffer {
	const width = Math.max(1, Math.round(opts.width))
	const height = Math.max(2, Math.round(opts.height))
	const pixels = Buffer.alloc(width * height * 4) // all transparent

	const fillRows = (fromRow: number, toRow: number, color: number): void => {
		for (let y = Math.max(0, fromRow); y < Math.min(height, toRow); y++) {
			for (let x = 0; x < width; x++) {
				const i = (y * width + x) * 4
				pixels[i] = (color >> 16) & 0xff
				pixels[i + 1] = (color >> 8) & 0xff
				pixels[i + 2] = color & 0xff
				pixels[i + 3] = 0xff
			}
		}
	}

	if (!opts.transparentBackground) fillRows(0, height, BACKGROUND)

	const mid = Math.floor(height / 2)
	const deviation = opts.deviation ?? 0
	const range = opts.rangePercent > 0 ? opts.rangePercent : 8
	const barRows = Math.round((Math.min(Math.abs(deviation), range) / range) * mid)
	if (barRows > 0) {
		const growsUp = deviation > 0 === opts.fasterIsUp
		const color = deviation > 0 ? opts.fasterColor : opts.slowerColor
		if (growsUp) fillRows(mid - barRows, mid, color)
		else fillRows(mid, mid + barRows, color)
	}

	const lineThickness = Math.max(1, Math.round(height / 36))
	fillRows(mid - Math.floor(lineThickness / 2), mid - Math.floor(lineThickness / 2) + lineThickness, CENTER_LINE)

	return pixels
}

/** Minimal PNG encoder for 8-bit RGBA pixel data. */
export function encodePngRgba(width: number, height: number, rgba: Buffer): Buffer {
	const chunk = (type: string, data: Buffer): Buffer => {
		const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
		const length = Buffer.alloc(4)
		length.writeUInt32BE(data.length)
		const crc = Buffer.alloc(4)
		crc.writeUInt32BE(crc32(typeAndData))
		return Buffer.concat([length, typeAndData, crc])
	}

	const header = Buffer.alloc(13)
	header.writeUInt32BE(width, 0)
	header.writeUInt32BE(height, 4)
	header[8] = 8 // bit depth
	header[9] = 6 // colour type: RGBA
	// compression, filter and interlace stay 0

	const rowLength = width * 4
	const raw = Buffer.alloc((rowLength + 1) * height)
	for (let y = 0; y < height; y++) {
		raw[y * (rowLength + 1)] = 0 // filter: none
		rgba.copy(raw, y * (rowLength + 1) + 1, y * rowLength, (y + 1) * rowLength)
	}

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0)),
	])
}

const cache = new Map<string, string>()

/** Renders the pitch bar as a base64 PNG, cached because feedbacks are re-checked on every poll pass. */
export function renderPitchBarPng64(opts: PitchBarOptions): string {
	const width = Math.max(1, Math.round(opts.width))
	const height = Math.max(2, Math.round(opts.height))
	const mid = Math.floor(height / 2)
	const range = opts.rangePercent > 0 ? opts.rangePercent : 8
	const deviation = opts.deviation ?? 0
	// Only the drawn bar length matters, so tiny deviation changes reuse the same image.
	const barRows = Math.round((Math.min(Math.abs(deviation), range) / range) * mid) * Math.sign(deviation)
	const key = [
		width,
		height,
		barRows,
		opts.fasterColor,
		opts.slowerColor,
		opts.fasterIsUp,
		opts.transparentBackground === true,
	].join(',')

	let png64 = cache.get(key)
	if (png64 === undefined) {
		png64 = encodePngRgba(width, height, renderPitchBarRgba({ ...opts, width, height })).toString('base64')
		if (cache.size > 500) cache.clear()
		cache.set(key, png64)
	}
	return png64
}
