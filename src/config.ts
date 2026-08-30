import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export const MIN_DECKS = 1
export const MAX_DECKS = 4
export const DEFAULT_DECKS = 2

export const MIN_POLL_INTERVAL_MS = 100
export const DEFAULT_POLL_INTERVAL_MS = 300

export interface ModuleConfig {
	host: string
	port: number
	bearerToken: string
	pollIntervalMs: number
	decks: number
	// Index signature required so this satisfies @companion-module/base's JsonObject constraint.
	[key: string]: string | number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'About',
			width: 12,
			value:
				'Requires VirtualDJ 2023+ (Pro license) with the "Network Control" plugin installed and running ' +
				'(Config → Extensions → Effects → Other → Network Control). Enter the host/port shown in that ' +
				"plugin's settings below.",
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'VirtualDJ Host / IP',
			width: 6,
			default: '127.0.0.1',
			// Regex.HOSTNAME alone (not concatenated with Regex.IP) is correct here: both
			// constants are already fully-delimited regex strings ("/^.../$/"), and naive
			// string concatenation of two of those breaks the pattern rather than OR-ing
			// them. HOSTNAME's dot-separated-alphanumeric-labels grammar already accepts
			// dotted-decimal IPs like "127.0.0.1" or "192.168.1.50" as a special case of a
			// valid hostname, so it covers both without needing Regex.IP at all.
			regex: Regex.HOSTNAME,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Network Control Port',
			width: 3,
			min: 1,
			max: 65535,
			default: 80,
		},
		{
			type: 'textinput',
			id: 'bearerToken',
			label: 'Bearer Token (optional)',
			width: 6,
			default: '',
			tooltip: 'Only required if a password is configured in the Network Control plugin settings.',
		},
		{
			type: 'number',
			id: 'pollIntervalMs',
			label: 'Poll Interval (ms)',
			width: 3,
			min: MIN_POLL_INTERVAL_MS,
			max: 10000,
			default: DEFAULT_POLL_INTERVAL_MS,
			tooltip:
				'How often to refresh fast-changing state (transport, mute/PFL, EQ kill, loop, FX). ' +
				'Track metadata, hot cues, sampler and automix state refresh 5x slower on their own tier ' +
				'to keep the request rate down. See README for the measured request budget.',
		},
		{
			type: 'number',
			id: 'decks',
			label: 'Number of Decks',
			width: 3,
			min: MIN_DECKS,
			max: MAX_DECKS,
			default: DEFAULT_DECKS,
		},
	]
}
