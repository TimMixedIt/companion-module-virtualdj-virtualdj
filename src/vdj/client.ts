/**
 * HTTP client for VirtualDJ's "Network Control" plugin.
 *
 * Protocol summary (see docs/VERB_SOURCES.md for the full citation trail):
 * - Two endpoints: POST /execute (runs a VDJScript action, body is "true"/"false")
 *   and POST /query (evaluates a VDJScript query, body is the raw result text).
 * - The script is sent as the raw POST body with `Content-Type: text/plain`.
 *   This is the officially documented method and avoids the ~2650 character
 *   GET URL-length limit that the plugin enforces (confirmed by independent
 *   local testing against a real VirtualDJ 2026 install - see VERB_SOURCES.md).
 * - Optional auth: `Authorization: Bearer <token>` header.
 * - A script that fails to evaluate still returns HTTP 200, with a body like
 *   `error:-2147467259`. That is a *scripting* outcome, not a transport
 *   failure, so it is returned as a normal (ok) result here - callers decide
 *   how to interpret the body. Only network failures, timeouts, and HTTP
 *   error statuses (auth failures in particular) are treated as transport
 *   errors.
 */

export type VdjEndpoint = 'execute' | 'query'

export interface VdjSuccess {
	ok: true
	body: string
}

export type VdjErrorReason = 'network' | 'timeout' | 'auth' | 'http'

export interface VdjFailure {
	ok: false
	reason: VdjErrorReason
	status?: number
	message: string
}

export type VdjResult = VdjSuccess | VdjFailure

export interface VdjClientOptions {
	host: string
	port: number
	bearerToken?: string
	/** Request timeout in milliseconds. */
	timeoutMs?: number
	/** Injectable fetch implementation, primarily for tests. */
	fetchImpl?: typeof fetch
}

const DEFAULT_TIMEOUT_MS = 4000

export class VdjClient {
	private host: string
	private port: number
	private bearerToken: string | undefined
	private timeoutMs: number
	private fetchImpl: typeof fetch

	constructor(options: VdjClientOptions) {
		this.host = options.host
		this.port = options.port
		this.bearerToken = options.bearerToken
		this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
		this.fetchImpl = options.fetchImpl ?? fetch
	}

	updateOptions(options: VdjClientOptions): void {
		this.host = options.host
		this.port = options.port
		this.bearerToken = options.bearerToken
		this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
		this.fetchImpl = options.fetchImpl ?? this.fetchImpl
	}

	/** Run a VDJScript action. Resolves the plugin's own "true"/"false" body as the `body` field. */
	async execute(script: string): Promise<VdjResult> {
		return this.request('execute', script)
	}

	/** Evaluate a VDJScript query and return its raw text result. */
	async query(script: string): Promise<VdjResult> {
		return this.request('query', script)
	}

	private async request(endpoint: VdjEndpoint, script: string): Promise<VdjResult> {
		const url = `http://${this.host}:${this.port}/${endpoint}`
		const headers: Record<string, string> = {
			'Content-Type': 'text/plain',
		}
		if (this.bearerToken) {
			headers['Authorization'] = `Bearer ${this.bearerToken}`
		}

		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), this.timeoutMs)

		try {
			const res = await this.fetchImpl(url, {
				method: 'POST',
				headers,
				body: script,
				signal: controller.signal,
			})

			if (res.status === 401 || res.status === 403) {
				return {
					ok: false,
					reason: 'auth',
					status: res.status,
					message: `VirtualDJ rejected the bearer token (HTTP ${res.status})`,
				}
			}

			if (!res.ok) {
				return {
					ok: false,
					reason: 'http',
					status: res.status,
					message: `Unexpected HTTP status ${res.status} from VirtualDJ`,
				}
			}

			const body = await res.text()
			return { ok: true, body }
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				return { ok: false, reason: 'timeout', message: `Request to VirtualDJ timed out after ${this.timeoutMs}ms` }
			}
			const message = err instanceof Error ? err.message : String(err)
			return { ok: false, reason: 'network', message: `Could not reach VirtualDJ: ${message}` }
		} finally {
			clearTimeout(timer)
		}
	}
}
