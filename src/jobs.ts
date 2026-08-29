import type { PollJob } from './poller.js'
import { HOTCUE_SLOTS, FX_SLOTS, SAMPLER_SLOTS } from './state.js'
import { parseVdjBoolean, parseVdjText, parseVdjNumber } from './vdj/parse.js'
import * as transport from './vdj/scripts/transport.js'
import * as mixer from './vdj/scripts/mixer.js'
import * as loops from './vdj/scripts/loopsHotcues.js'
import * as effects from './vdj/scripts/effects.js'
import * as master from './vdj/scripts/masterRecording.js'
import * as sampler from './vdj/scripts/sampler.js'
import * as browserAutomix from './vdj/scripts/browserAutomix.js'

/**
 * Builds the full set of poll jobs for the currently configured number of
 * decks. Called fresh on every pass (see Poller) so it always reflects the
 * live deck count from config.
 */
export function buildPollJobs(deckCount: number): PollJob[] {
	const jobs: PollJob[] = []

	for (let deck = 1; deck <= deckCount; deck++) {
		// --- fast tier: needs to feel instant on a button press ---
		jobs.push({
			key: `deck${deck}.playing`,
			tier: 'fast',
			kind: 'query',
			script: transport.qPlaying(deck),
			apply: (body, state) => {
				state.getDeck(deck).playing = parseVdjBoolean(body)
			},
		})
		jobs.push({
			key: `deck${deck}.loaded`,
			tier: 'fast',
			kind: 'query',
			script: transport.qLoaded(deck),
			apply: (body, state) => {
				state.getDeck(deck).loaded = parseVdjBoolean(body)
			},
		})
		jobs.push({
			key: `deck${deck}.mute`,
			tier: 'fast',
			kind: 'query',
			script: mixer.qMute(deck),
			apply: (body, state) => {
				state.getDeck(deck).mute = parseVdjBoolean(body)
			},
		})
		jobs.push({
			key: `deck${deck}.pfl`,
			tier: 'fast',
			kind: 'query',
			script: mixer.qPfl(deck),
			apply: (body, state) => {
				state.getDeck(deck).pfl = parseVdjBoolean(body)
			},
		})
		jobs.push({
			key: `deck${deck}.eqKillHigh`,
			tier: 'fast',
			kind: 'query',
			script: mixer.qEqKillHigh(deck),
			apply: (body, state) => {
				state.getDeck(deck).eqKillHigh = parseVdjBoolean(body)
			},
		})
		jobs.push({
			key: `deck${deck}.eqKillMid`,
			tier: 'fast',
			kind: 'query',
			script: mixer.qEqKillMid(deck),
			apply: (body, state) => {
				state.getDeck(deck).eqKillMid = parseVdjBoolean(body)
			},
		})
		jobs.push({
			key: `deck${deck}.eqKillLow`,
			tier: 'fast',
			kind: 'query',
			script: mixer.qEqKillLow(deck),
			apply: (body, state) => {
				state.getDeck(deck).eqKillLow = parseVdjBoolean(body)
			},
		})
		jobs.push({
			key: `deck${deck}.loopActive`,
			tier: 'fast',
			kind: 'query',
			script: loops.qActiveLoop(deck),
			apply: (body, state) => {
				const value = parseVdjNumber(body)
				state.getDeck(deck).loopActive = value !== undefined && value > 0
			},
		})
		jobs.push({
			key: `deck${deck}.mixfxActive`,
			tier: 'fast',
			kind: 'query',
			script: effects.qMixfxActive(deck),
			apply: (body, state) => {
				state.getDeck(deck).mixfxActive = parseVdjBoolean(body)
			},
		})
		for (let slot = 1; slot <= FX_SLOTS; slot++) {
			jobs.push({
				key: `deck${deck}.fx${slot}.active`,
				tier: 'fast',
				kind: 'query',
				script: effects.qEffectActive(deck, slot),
				apply: (body, state) => {
					state.getDeck(deck).effectActive[slot - 1] = parseVdjBoolean(body)
				},
			})
		}

		// --- slow tier: only changes when a track loads or is (re)programmed ---
		jobs.push({
			key: `deck${deck}.title`,
			tier: 'slow',
			kind: 'query',
			script: transport.qTitle(deck),
			apply: (body, state) => {
				state.getDeck(deck).title = parseVdjText(body)
			},
		})
		jobs.push({
			key: `deck${deck}.artist`,
			tier: 'slow',
			kind: 'query',
			script: transport.qArtist(deck),
			apply: (body, state) => {
				state.getDeck(deck).artist = parseVdjText(body)
			},
		})
		jobs.push({
			key: `deck${deck}.bpm`,
			tier: 'slow',
			kind: 'query',
			script: transport.qBpm(deck),
			apply: (body, state) => {
				state.getDeck(deck).bpm = parseVdjText(body)
			},
		})
		jobs.push({
			key: `deck${deck}.key`,
			tier: 'slow',
			kind: 'query',
			script: transport.qKey(deck),
			apply: (body, state) => {
				state.getDeck(deck).key = parseVdjText(body)
			},
		})
		jobs.push({
			key: `deck${deck}.pitch`,
			tier: 'slow',
			kind: 'query',
			script: transport.qPitch(deck),
			apply: (body, state) => {
				state.getDeck(deck).pitch = parseVdjText(body)
			},
		})
		jobs.push({
			key: `deck${deck}.remainingTime`,
			tier: 'slow',
			kind: 'query',
			script: transport.qRemainingTime(deck),
			apply: (body, state) => {
				state.getDeck(deck).remainingTime = parseVdjText(body)
			},
		})
		jobs.push({
			key: `deck${deck}.hasError`,
			tier: 'slow',
			kind: 'query',
			script: transport.qDeckHasError(deck),
			apply: (body, state) => {
				state.getDeck(deck).hasError = parseVdjBoolean(body)
			},
		})
		for (let slot = 1; slot <= FX_SLOTS; slot++) {
			jobs.push({
				key: `deck${deck}.fx${slot}.name`,
				tier: 'slow',
				kind: 'query',
				script: effects.qEffectName(deck, slot),
				apply: (body, state) => {
					state.getDeck(deck).effectName[slot - 1] = parseVdjText(body)
				},
			})
		}
		for (let slot = 1; slot <= HOTCUE_SLOTS; slot++) {
			jobs.push({
				key: `deck${deck}.hotcue${slot}`,
				tier: 'slow',
				kind: 'query',
				script: loops.qHasCue(deck, slot),
				apply: (body, state) => {
					state.getDeck(deck).hotCueSet[slot - 1] = parseVdjBoolean(body)
				},
			})
		}
	}

	// --- global fast tier ---
	jobs.push({
		key: 'global.crossfader',
		tier: 'fast',
		kind: 'query',
		script: mixer.qCrossfader(),
		apply: (body, state) => {
			state.global.crossfader = parseVdjNumber(body)
		},
	})

	// --- global slow tier ---
	jobs.push({
		key: 'global.automix',
		tier: 'slow',
		kind: 'query',
		script: browserAutomix.qAutomix(),
		apply: (body, state) => {
			state.global.automixActive = parseVdjBoolean(body)
		},
	})
	jobs.push({
		key: 'global.record',
		tier: 'slow',
		kind: 'query',
		script: master.qRecord(),
		apply: (body, state) => {
			state.global.recording = parseVdjBoolean(body)
		},
	})
	jobs.push({
		key: 'global.broadcast',
		tier: 'slow',
		kind: 'query',
		script: master.qBroadcast(),
		apply: (body, state) => {
			state.global.broadcasting = parseVdjBoolean(body)
		},
	})
	jobs.push({
		key: 'global.recordTime',
		tier: 'slow',
		kind: 'query',
		script: master.qRecordTime(),
		apply: (body, state) => {
			state.global.recordTime = parseVdjText(body)
		},
	})
	jobs.push({
		key: 'global.samplerUsed',
		tier: 'slow',
		kind: 'query',
		script: sampler.qSamplerUsed(),
		apply: (body, state) => {
			state.global.samplerUsed = parseVdjBoolean(body)
		},
	})
	for (let slot = 1; slot <= SAMPLER_SLOTS; slot++) {
		jobs.push({
			key: `global.samplerSlot${slot}.loaded`,
			tier: 'slow',
			kind: 'query',
			script: sampler.qSamplerLoaded(slot),
			apply: (body, state) => {
				state.global.samplerSlotLoaded[slot - 1] = parseVdjBoolean(body)
			},
		})
	}

	return jobs
}
