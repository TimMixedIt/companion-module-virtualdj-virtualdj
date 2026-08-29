import http from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * A minimal stand-in for VirtualDJ's Network Control plugin, covering exactly
 * the HTTP behaviour this module depends on:
 * - POST /execute and POST /query, script as the raw text body (also accepts
 *   ?script= for convenience in ad-hoc tests).
 * - /execute replies "true"/"false"; /query replies raw text, or
 *   "error:-2147467259" for a script this mock doesn't recognise - mirroring
 *   the real plugin's documented behaviour (HTTP 200 either way).
 * - Optional bearer token, checked via the Authorization header or a
 *   `bearer` query parameter; wrong/missing token -> HTTP 401.
 * - A request log so tests can assert on request counts/timing/scripts sent.
 * - Deliberate-failure hooks (`failNextRequests`, `delayNextRequestsMs`) to
 *   exercise the module's connection/timeout/HTTP-error handling.
 *
 * This only implements the small vocabulary of VDJScript this module
 * actually sends (see src/vdj/scripts/*.ts) - it is not a general VDJScript
 * interpreter.
 */

export interface MockDeckState {
	playing: boolean
	loaded: boolean
	hasError: boolean
	title: string
	artist: string
	bpm: string
	key: string
	pitch: string
	remaining: string
	mute: boolean
	pfl: boolean
	eqHigh: number
	eqMid: number
	eqLow: number
	eqKillHigh: boolean
	eqKillMid: boolean
	eqKillLow: boolean
	loopBeats: number
	cues: Map<number, { color: string; name: string }>
	fxActive: boolean[]
	fxName: string[]
	mixfxActive: boolean
}

export interface MockGlobalState {
	crossfader: number
	automix: boolean
	recording: boolean
	broadcasting: boolean
	recordTime: string
	samplerUsed: boolean
	samplerSlotLoaded: Map<number, boolean>
}

export interface RequestLogEntry {
	method: string
	endpoint: 'execute' | 'query'
	script: string
	timestamp: number
}

function defaultDeckState(): MockDeckState {
	return {
		playing: false,
		loaded: false,
		hasError: false,
		title: '',
		artist: '',
		bpm: '',
		key: '',
		pitch: '100%',
		remaining: '',
		mute: false,
		pfl: false,
		eqHigh: 50,
		eqMid: 50,
		eqLow: 50,
		eqKillHigh: false,
		eqKillMid: false,
		eqKillLow: false,
		loopBeats: 0,
		cues: new Map(),
		fxActive: [false, false, false],
		fxName: ['', '', ''],
		mixfxActive: false,
	}
}

/** Tokenizes VDJScript-ish text, keeping single/double-quoted strings intact and unquoted. */
function tokenize(script: string): string[] {
	const tokens: string[] = []
	const re = /'[^']*'|"[^"]*"|\S+/g
	let match: RegExpExecArray | null
	while ((match = re.exec(script))) {
		let tok = match[0]
		if ((tok.startsWith("'") && tok.endsWith("'")) || (tok.startsWith('"') && tok.endsWith('"'))) {
			tok = tok.slice(1, -1)
		}
		tokens.push(tok)
	}
	return tokens
}

export class MockVdjServer {
	readonly decks = new Map<number, MockDeckState>()
	readonly global: MockGlobalState = {
		crossfader: 0.5,
		automix: false,
		recording: false,
		broadcasting: false,
		recordTime: '00:00:00',
		samplerUsed: false,
		samplerSlotLoaded: new Map(),
	}
	readonly requestLog: RequestLogEntry[] = []

	private server: http.Server | undefined
	private bearerToken: string | undefined
	private failNextCount = 0
	private failNextStatus = 500
	private delayNextCount = 0
	private delayNextMs = 0

	constructor(options: { bearerToken?: string } = {}) {
		this.bearerToken = options.bearerToken
	}

	deck(n: number): MockDeckState {
		let d = this.decks.get(n)
		if (!d) {
			d = defaultDeckState()
			this.decks.set(n, d)
		}
		return d
	}

	loadTrack(
		deckNum: number,
		track: { title: string; artist: string; bpm: string; key?: string; pitch?: string; remaining?: string },
	): void {
		const d = this.deck(deckNum)
		d.loaded = true
		d.title = track.title
		d.artist = track.artist
		d.bpm = track.bpm
		d.key = track.key ?? d.key
		d.pitch = track.pitch ?? d.pitch
		d.remaining = track.remaining ?? d.remaining
	}

	setBearerToken(token: string | undefined): void {
		this.bearerToken = token
	}

	/** Makes the next `count` requests fail with the given HTTP status (default 500), regardless of script. */
	failNextRequests(count: number, status = 500): void {
		this.failNextCount = count
		this.failNextStatus = status
	}

	/** Delays the next `count` requests by `ms` before responding, to exercise client-side timeouts. */
	delayNextRequests(count: number, ms: number): void {
		this.delayNextCount = count
		this.delayNextMs = ms
	}

	async listen(port = 0): Promise<number> {
		this.server = http.createServer((req, res) => {
			void this.handleRequest(req, res)
		})
		await new Promise<void>((resolve) => this.server?.listen(port, '127.0.0.1', resolve))
		return (this.server?.address() as AddressInfo).port
	}

	async close(): Promise<void> {
		if (!this.server?.listening) return
		await new Promise<void>((resolve, reject) => {
			this.server?.close((err) => (err ? reject(err) : resolve()))
		})
	}

	private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
		// Always fully drain the request body first, even on an early-exit path
		// (auth/forced-failure/delay). Leaving a POST body unread on a keep-alive socket
		// corrupts the next request parsed off the same connection - it doesn't fail
		// cleanly, it manifests as sporadic unrelated fetch failures on *later* requests.
		const bodyPromise = readBody(req)

		const url = new URL(req.url ?? '/', 'http://localhost')
		const endpoint = url.pathname.replace(/^\//, '')

		if (endpoint !== 'execute' && endpoint !== 'query') {
			await bodyPromise
			res.writeHead(200, { 'Content-Type': 'text/html' })
			res.end('<html><body>VirtualDJ Network Control</body></html>')
			return
		}

		if (this.delayNextCount > 0) {
			this.delayNextCount--
			await sleep(this.delayNextMs)
		}

		if (this.failNextCount > 0) {
			this.failNextCount--
			await bodyPromise
			res.writeHead(this.failNextStatus)
			res.end()
			return
		}

		if (this.bearerToken) {
			const header = req.headers['authorization']
			const headerToken = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
			const queryToken = url.searchParams.get('bearer') ?? undefined
			if (headerToken !== this.bearerToken && queryToken !== this.bearerToken) {
				await bodyPromise
				res.writeHead(401)
				res.end('unauthorized')
				return
			}
		}

		const body = await bodyPromise
		const script = (body || url.searchParams.get('script') || '').trim()

		if (!script) {
			res.writeHead(400)
			res.end()
			return
		}

		this.requestLog.push({ method: req.method ?? 'GET', endpoint, script, timestamp: Date.now() })

		if (endpoint === 'execute') {
			const ok = this.execute(script)
			res.writeHead(200, { 'Content-Type': 'text/plain' })
			res.end(ok ? 'true' : 'false')
			return
		}

		const result = this.query(script)
		res.writeHead(200, { 'Content-Type': 'text/plain' })
		res.end(result ?? 'error:-2147467259')
	}

	private execute(script: string): boolean {
		const tokens = tokenize(script)
		let i = 0
		let deckNum: number | undefined
		if (tokens[i] === 'deck') {
			deckNum = Number(tokens[i + 1])
			i += 2
		}
		const verb = tokens[i]
		const args = tokens.slice(i + 1)
		const d = deckNum !== undefined ? this.deck(deckNum) : undefined

		switch (verb) {
			case 'play':
				if (d) d.playing = true
				return true
			case 'pause':
				if (d) d.playing = false
				return true
			case 'play_pause':
				if (d) d.playing = !d.playing
				return true
			case 'stop':
				if (d) d.playing = false
				return true
			case 'cue':
			case 'cue_play':
			case 'sync':
			case 'browser_enter':
				return true
			case 'unload':
				if (d) Object.assign(d, defaultDeckState())
				return true
			case 'load':
				if (d) {
					d.loaded = true
					if (args[0]) d.title = args[0]
				}
				return true
			case 'load_next':
			case 'load_previous':
				if (d) d.loaded = true
				return true
			case 'mute':
				if (d) d.mute = !d.mute
				return true
			case 'pfl':
				if (d) d.pfl = !d.pfl
				return true
			case 'eq_high':
				if (d) d.eqHigh = parsePercent(args[0])
				return true
			case 'eq_mid':
				if (d) d.eqMid = parsePercent(args[0])
				return true
			case 'eq_low':
				if (d) d.eqLow = parsePercent(args[0])
				return true
			case 'eq_kill_high':
				if (d) d.eqKillHigh = !d.eqKillHigh
				return true
			case 'eq_kill_mid':
				if (d) d.eqKillMid = !d.eqKillMid
				return true
			case 'eq_kill_low':
				if (d) d.eqKillLow = !d.eqKillLow
				return true
			case 'crossfader':
				this.global.crossfader = parsePercent(args[0]) / 100
				return true
			case 'cross_assign':
				return true
			case 'master_volume':
			case 'booth_volume':
			case 'headphone_volume':
				return true
			case 'loop':
				if (d) d.loopBeats = Number(args[0]) || 0
				return true
			case 'loop_in':
			case 'loop_out':
			case 'reloop':
				return true
			case 'loop_exit':
				if (d) d.loopBeats = 0
				return true
			case 'loop_double':
				if (d) d.loopBeats *= 2
				return true
			case 'loop_half':
				if (d) d.loopBeats /= 2
				return true
			case 'loop_roll':
				return true
			case 'hot_cue': {
				const slot = Number(args[0])
				if (d) {
					if (d.cues.has(slot)) d.cues.delete(slot)
					else d.cues.set(slot, { color: 'red', name: `Cue ${slot}` })
				}
				return true
			}
			case 'delete_cue': {
				const slot = Number(args[0])
				if (d) d.cues.delete(slot)
				return true
			}
			case 'goto_cue':
				return true
			case 'effect_active': {
				const slot = Number(args[0]) - 1
				if (d && slot >= 0 && slot < d.fxActive.length) {
					if (args[1] === 'on') d.fxActive[slot] = true
					else if (args[1] === 'off') d.fxActive[slot] = false
					else d.fxActive[slot] = !d.fxActive[slot]
				}
				return true
			}
			case 'effect_select': {
				const slot = Number(args[0]) - 1
				if (d && slot >= 0 && slot < d.fxName.length) d.fxName[slot] = args[1] ?? ''
				return true
			}
			case 'effect_slider':
			case 'effect_disable_all':
				return true
			case 'effect_mixfx_activate':
				if (d) d.mixfxActive = !d.mixfxActive
				return true
			case 'effect_mixfx_select':
				return true
			case 'browser_scroll':
			case 'search':
			case 'clear_search':
			case 'automix_skip':
			case 'mix_now':
			case 'playlist_add':
				return true
			case 'automix':
				this.global.automix = !this.global.automix
				return true
			case 'sampler_play':
			case 'sampler_stop':
			case 'sampler_pad':
			case 'sampler_pad_page':
			case 'sampler_bank':
				if (verb === 'sampler_stop' && args[0] !== 'all') {
					const slot = Number(args[0])
					this.global.samplerSlotLoaded.set(slot, this.global.samplerSlotLoaded.get(slot) ?? false)
				}
				return true
			case 'record':
				this.global.recording = !this.global.recording
				return true
			case 'broadcast':
				this.global.broadcasting = !this.global.broadcasting
				return true
			case 'broadcast_message':
				return true
			default:
				return false
		}
	}

	private query(script: string): string | undefined {
		const tokens = tokenize(script)
		let i = 0
		let deckNum: number | undefined
		if (tokens[i] === 'deck') {
			deckNum = Number(tokens[i + 1])
			i += 2
		}
		const verb = tokens[i]
		const args = tokens.slice(i + 1)
		const d = deckNum !== undefined ? this.decks.get(deckNum) : undefined

		switch (verb) {
			case 'play':
				return d ? boolYesNo(d.playing) : 'no'
			case 'loaded':
				return d ? boolYesNo(d.loaded) : 'no'
			case 'deck_has_error':
				return d ? boolYesNo(d.hasError) : 'no'
			case 'get_title':
				return d?.loaded ? d.title : ''
			case 'get_artist':
				return d?.loaded ? d.artist : ''
			case 'get_bpm':
				return d?.loaded ? d.bpm : ''
			case 'get_key':
				return d?.loaded ? d.key : ''
			case 'get_pitch_value':
				return d ? d.pitch : ''
			case 'get_time':
				return d?.loaded ? d.remaining : ''
			case 'mute':
				return d ? boolYesNo(d.mute) : 'no'
			case 'pfl':
				return d ? boolYesNo(d.pfl) : 'no'
			case 'eq_kill_high':
				return d ? boolOnOff(d.eqKillHigh) : 'off'
			case 'eq_kill_mid':
				return d ? boolOnOff(d.eqKillMid) : 'off'
			case 'eq_kill_low':
				return d ? boolOnOff(d.eqKillLow) : 'off'
			case 'crossfader':
				return String(this.global.crossfader)
			case 'get_level':
				return '0.5'
			case 'get_active_loop':
				return d ? String(d.loopBeats) : '0'
			case 'has_cue': {
				const slot = Number(args[0])
				return boolTrueFalse(d?.cues.has(slot) ?? false)
			}
			case 'cue_color': {
				const slot = Number(args[0])
				return d?.cues.get(slot)?.color ?? ''
			}
			case 'cue_name': {
				const slot = Number(args[0])
				return d?.cues.get(slot)?.name ?? ''
			}
			case 'effect_active': {
				const slot = Number(args[0]) - 1
				return d ? boolOnOff(d.fxActive[slot] ?? false) : 'off'
			}
			case 'get_effect_name': {
				const slot = Number(args[0]) - 1
				return d?.fxName[slot] ?? ''
			}
			case 'get_mixfx_active':
				return d ? boolOnOff(d.mixfxActive) : 'off'
			case 'get_automix':
				return boolYesNo(this.global.automix)
			case 'sampler_used':
				return boolYesNo(this.global.samplerUsed)
			case 'sampler_loaded': {
				const slot = Number(args[0])
				return boolYesNo(this.global.samplerSlotLoaded.get(slot) ?? false)
			}
			case 'get_sampler_bank':
				return 'Default'
			case 'record':
				return boolYesNo(this.global.recording)
			case 'broadcast':
				return boolYesNo(this.global.broadcasting)
			case 'get_record_time':
				return this.global.recordTime
			default:
				return undefined
		}
	}
}

function parsePercent(token: string | undefined): number {
	if (!token) return 0
	return Number(token.replace('%', '')) || 0
}
function boolYesNo(v: boolean): string {
	return v ? 'yes' : 'no'
}
function boolOnOff(v: boolean): string {
	return v ? 'on' : 'off'
}
function boolTrueFalse(v: boolean): string {
	return v ? 'true' : 'false'
}
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
async function readBody(req: http.IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		req.on('data', (chunk: Buffer) => chunks.push(chunk))
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
		req.on('error', reject)
	})
}
