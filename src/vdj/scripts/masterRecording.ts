import { quote } from './common.js'

/** Master output & recording/broadcasting VDJScript. All UNCONFIRMED - Official appendix only,
 * no independent corroboration found. See docs/VERB_SOURCES.md. */

export const record = (): string => 'record'
export const qRecord = (): string => 'record'

export const broadcast = (): string => 'broadcast'
export const qBroadcast = (): string => 'broadcast'

export const qRecordTime = (): string => 'get_record_time'

export const broadcastMessage = (message: string): string => `broadcast_message ${quote(message)}`
