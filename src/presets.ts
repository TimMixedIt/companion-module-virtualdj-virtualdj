import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetSection } from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { ModuleSchema } from './main.js'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const DARK = combineRgb(20, 20, 20)

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}
	const deckPresetIds: string[] = []
	const globalPresetIds: string[] = []

	for (let deck = 1; deck <= self.config.decks; deck++) {
		const playId = `deck${deck}_play_pause`
		presets[playId] = {
			type: 'simple',
			name: `Deck ${deck}: Play/Pause`,
			style: { text: `▶/❚❚\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [
				{
					down: [{ actionId: 'deck_play', options: { deck } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'deck_playing',
					options: { deck },
					style: { bgcolor: combineRgb(0, 204, 0), color: BLACK },
				},
			],
		}
		deckPresetIds.push(playId)

		const pauseId = `deck${deck}_pause`
		presets[pauseId] = {
			type: 'simple',
			name: `Deck ${deck}: Pause`,
			style: { text: `❚❚\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'deck_pause', options: { deck } }], up: [] }],
			feedbacks: [],
		}
		deckPresetIds.push(pauseId)

		const cueId = `deck${deck}_cue`
		presets[cueId] = {
			type: 'simple',
			name: `Deck ${deck}: Cue`,
			style: { text: `CUE\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'deck_cue', options: { deck } }], up: [] }],
			feedbacks: [],
		}
		deckPresetIds.push(cueId)

		const syncId = `deck${deck}_sync`
		presets[syncId] = {
			type: 'simple',
			name: `Deck ${deck}: Sync`,
			style: { text: `SYNC\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'deck_sync', options: { deck } }], up: [] }],
			feedbacks: [],
		}
		deckPresetIds.push(syncId)

		for (const slot of [1, 2, 3, 4]) {
			const hcId = `deck${deck}_hotcue${slot}`
			presets[hcId] = {
				type: 'simple',
				name: `Deck ${deck}: Hot Cue ${slot}`,
				style: { text: `HC ${slot}\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
				steps: [{ down: [{ actionId: 'hotcue_trigger', options: { deck, slot } }], up: [] }],
				feedbacks: [
					{
						feedbackId: 'deck_hotcue_set',
						options: { deck, slot },
						style: { bgcolor: combineRgb(0, 153, 76), color: WHITE },
					},
				],
			}
			deckPresetIds.push(hcId)
		}

		const loopId = `deck${deck}_loop8`
		presets[loopId] = {
			type: 'simple',
			name: `Deck ${deck}: Loop 8 Beats`,
			style: { text: `LOOP 8\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'loop_set', options: { deck, beats: 8 } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'deck_loop_active',
					options: { deck },
					style: { bgcolor: combineRgb(230, 179, 0), color: BLACK },
				},
			],
		}
		deckPresetIds.push(loopId)

		const loopExitId = `deck${deck}_loop_exit`
		presets[loopExitId] = {
			type: 'simple',
			name: `Deck ${deck}: Exit Loop`,
			style: { text: `LOOP\\nEXIT`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'loop_exit', options: { deck } }], up: [] }],
			feedbacks: [],
		}
		deckPresetIds.push(loopExitId)

		const eqBands: {
			id: 'mixer_eq_kill_high_toggle' | 'mixer_eq_kill_mid_toggle' | 'mixer_eq_kill_low_toggle'
			fb: 'deck_eq_kill_high' | 'deck_eq_kill_mid' | 'deck_eq_kill_low'
			label: string
		}[] = [
			{ id: 'mixer_eq_kill_high_toggle', fb: 'deck_eq_kill_high', label: 'HI' },
			{ id: 'mixer_eq_kill_mid_toggle', fb: 'deck_eq_kill_mid', label: 'MID' },
			{ id: 'mixer_eq_kill_low_toggle', fb: 'deck_eq_kill_low', label: 'LOW' },
		]
		for (const band of eqBands) {
			const eqId = `deck${deck}_eqkill_${band.label.toLowerCase()}`
			presets[eqId] = {
				type: 'simple',
				name: `Deck ${deck}: EQ Kill ${band.label}`,
				style: { text: `KILL\\n${band.label}`, size: '14', color: WHITE, bgcolor: DARK },
				steps: [{ down: [{ actionId: band.id, options: { deck } }], up: [] }],
				feedbacks: [
					{ feedbackId: band.fb, options: { deck }, style: { bgcolor: combineRgb(204, 68, 0), color: WHITE } },
				],
			}
			deckPresetIds.push(eqId)
		}

		const muteId = `deck${deck}_mute`
		presets[muteId] = {
			type: 'simple',
			name: `Deck ${deck}: Mute`,
			style: { text: `MUTE\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'mixer_mute_toggle', options: { deck } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'deck_mute', options: { deck }, style: { bgcolor: combineRgb(153, 0, 0), color: WHITE } },
			],
		}
		deckPresetIds.push(muteId)

		const pflId = `deck${deck}_pfl`
		presets[pflId] = {
			type: 'simple',
			name: `Deck ${deck}: PFL`,
			style: { text: `PFL\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'mixer_pfl_toggle', options: { deck } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'deck_pfl', options: { deck }, style: { bgcolor: combineRgb(0, 102, 204), color: WHITE } },
			],
		}
		deckPresetIds.push(pflId)

		const fxId = `deck${deck}_fx1_toggle`
		presets[fxId] = {
			type: 'simple',
			name: `Deck ${deck}: FX Slot 1 Toggle`,
			style: { text: `FX 1\\nDeck ${deck}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'fx_toggle', options: { deck, slot: 1 } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'fx_active',
					options: { deck, slot: 1 },
					style: { bgcolor: combineRgb(153, 0, 153), color: WHITE },
				},
			],
		}
		deckPresetIds.push(fxId)
	}

	presets['automix_toggle'] = {
		type: 'simple',
		name: 'Automix: Toggle',
		style: { text: 'AUTO\\nMIX', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'automix_toggle', options: {} }], up: [] }],
		feedbacks: [
			{ feedbackId: 'automix_active', options: {}, style: { bgcolor: combineRgb(0, 102, 51), color: WHITE } },
		],
	}
	globalPresetIds.push('automix_toggle')

	presets['record_toggle'] = {
		type: 'simple',
		name: 'Recording: Toggle',
		style: { text: 'REC', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'record_toggle', options: {} }], up: [] }],
		feedbacks: [
			{ feedbackId: 'recording_active', options: {}, style: { bgcolor: combineRgb(204, 0, 0), color: WHITE } },
		],
	}
	globalPresetIds.push('record_toggle')

	const pitchPresetIds: string[] = []
	const pitchTargets = [
		{ id: 'active', deck: 0, label: 'Playing Deck', text: '$(VirtualDJ:active_pitch)' },
		...Array.from({ length: self.config.decks }, (_, i) => ({
			id: `deck${i + 1}`,
			deck: i + 1,
			label: `Deck ${i + 1}`,
			text: `$(VirtualDJ:deck${i + 1}_pitch)`,
		})),
	]
	for (const target of pitchTargets) {
		const presetId = `pitch_bar_${target.id}`
		presets[presetId] = {
			type: 'simple',
			name: `Pitch Bar: ${target.label}`,
			style: { text: target.text, size: '18', color: WHITE, bgcolor: BLACK },
			steps: [],
			feedbacks: [
				{
					feedbackId: 'deck_pitch_bar',
					options: {
						deck: target.deck,
						rangePercent: 8,
						direction: 'down',
						fasterColor: combineRgb(0, 170, 0),
						slowerColor: combineRgb(200, 0, 0),
						background: 'black',
					},
				},
			],
		}
		pitchPresetIds.push(presetId)
	}

	// Track cards: title, artist and BPM on top of a pitch bar, turning green while the deck plays.
	// The bar's background is transparent so the playing colour shows through; the bar itself is
	// blue/orange so it stays visible on both the black and the green background.
	for (let deck = 1; deck <= self.config.decks; deck++) {
		const presetId = `track_card_deck${deck}`
		presets[presetId] = {
			type: 'simple',
			name: `Track Card: Deck ${deck}`,
			style: {
				text: `$(VirtualDJ:deck${deck}_title)\\n$(VirtualDJ:deck${deck}_artist) - $(VirtualDJ:deck${deck}_bpm_rounded) BPM`,
				size: 'auto',
				color: WHITE,
				bgcolor: BLACK,
			},
			steps: [],
			feedbacks: [
				{
					feedbackId: 'deck_playing',
					options: { deck },
					style: { bgcolor: combineRgb(0, 130, 0), color: WHITE },
				},
				{
					feedbackId: 'deck_pitch_bar',
					options: {
						deck,
						rangePercent: 8,
						direction: 'down',
						fasterColor: combineRgb(0, 140, 255),
						slowerColor: combineRgb(255, 140, 0),
						background: 'transparent',
					},
				},
			],
		}
		pitchPresetIds.push(presetId)
	}

	const structure: CompanionPresetSection<ModuleSchema>[] = [
		{
			id: 'decks',
			name: 'Decks',
			description: 'Transport, hot cues, loops, EQ kill, mute/PFL and FX per deck.',
			definitions: [{ id: 'decks-group', type: 'simple', name: 'Decks', presets: deckPresetIds }],
		},
		{
			id: 'pitch',
			name: 'Pitch',
			description:
				'Pitch-fader style bar (grows down when faster than the original tempo, up when slower), and ' +
				'track cards with title, artist and BPM on top of it that turn green while the deck plays.',
			definitions: [{ id: 'pitch-group', type: 'simple', name: 'Pitch', presets: pitchPresetIds }],
		},
		{
			id: 'global',
			name: 'Global',
			description: 'Automix and recording.',
			definitions: [{ id: 'global-group', type: 'simple', name: 'Global', presets: globalPresetIds }],
		},
	]

	self.setPresetDefinitions(structure, presets)
}
