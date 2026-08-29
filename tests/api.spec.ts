import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { VdjClient } from '../src/vdj/client.js'
import { MockVdjServer } from './mockVdjServer.js'

describe('VdjClient against a mock Network Control plugin', () => {
	let server: MockVdjServer
	let port: number
	let client: VdjClient

	beforeEach(async () => {
		server = new MockVdjServer()
		port = await server.listen()
		client = new VdjClient({ host: '127.0.0.1', port, timeoutMs: 500 })
	})

	afterEach(async () => {
		await server.close()
	})

	it('executes an action and reports the plugin-native true/false body', async () => {
		const result = await client.execute('deck 1 play')
		expect(result).toEqual({ ok: true, body: 'true' })
		expect(server.deck(1).playing).toBe(true)
	})

	it('queries state and returns the raw text body', async () => {
		server.loadTrack(1, { title: 'Body Lang', artist: 'Balanka', bpm: '127.999' })
		const result = await client.query('deck 1 get_title')
		expect(result).toEqual({ ok: true, body: 'Body Lang' })
	})

	it('treats an unrecognised query as a successful transport call carrying an error body', async () => {
		const result = await client.query('zzz_not_a_real_verb')
		expect(result.ok).toBe(true)
		if (result.ok) expect(result.body).toBe('error:-2147467259')
	})

	it('sends the script as a raw POST body', async () => {
		await client.execute(`deck 1 effect_select 2 'Echo'`)
		expect(server.requestLog.at(-1)).toMatchObject({
			method: 'POST',
			endpoint: 'execute',
			script: `deck 1 effect_select 2 'Echo'`,
		})
	})

	it('reports a wrong bearer token as an auth failure, not a crash', async () => {
		server.setBearerToken('correct-token')
		const wrongClient = new VdjClient({ host: '127.0.0.1', port, bearerToken: 'wrong-token', timeoutMs: 500 })
		const result = await wrongClient.execute('deck 1 play')
		expect(result).toEqual({ ok: false, reason: 'auth', status: 401, message: expect.any(String) })
	})

	it('succeeds once the correct bearer token is supplied', async () => {
		server.setBearerToken('correct-token')
		const rightClient = new VdjClient({ host: '127.0.0.1', port, bearerToken: 'correct-token', timeoutMs: 500 })
		const result = await rightClient.execute('deck 1 play')
		expect(result.ok).toBe(true)
	})

	it('reports a non-2xx HTTP status as an http failure', async () => {
		server.failNextRequests(1, 500)
		const result = await client.execute('deck 1 play')
		expect(result).toEqual({ ok: false, reason: 'http', status: 500, message: expect.any(String) })
	})

	it('reports a request that exceeds the timeout as a timeout failure', async () => {
		server.delayNextRequests(1, 2000)
		const fastClient = new VdjClient({ host: '127.0.0.1', port, timeoutMs: 100 })
		const result = await fastClient.execute('deck 1 play')
		expect(result).toEqual({ ok: false, reason: 'timeout', message: expect.any(String) })
	})

	it('reports a dropped connection as a network failure', async () => {
		await server.close()
		const result = await client.execute('deck 1 play')
		expect(result.ok).toBe(false)
		if (!result.ok) expect(result.reason).toBe('network')
	})
})
