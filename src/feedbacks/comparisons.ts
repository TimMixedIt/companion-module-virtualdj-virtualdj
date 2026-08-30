import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { deckDropdown, comparisonOperatorDropdown, compareNumbers, type ComparisonOperator } from '../optionHelpers.js'
import { parseVdjNumber, parseVdjText } from '../vdj/parse.js'

/**
 * Numeric/text comparisons over cached poll state - no new VDJScript verbs, just
 * comparisons on values this module already polls (see docs/VERB_SOURCES.md for
 * the underlying `get_bpm`/`get_key`/`get_pitch_value` verbs' confidence).
 */

export type ComparisonFeedbacksSchema = {
	deck_bpm_compare: { type: 'boolean'; options: { deck: number; operator: ComparisonOperator; threshold: number } }
	decks_bpm_match: { type: 'boolean'; options: { deckA: number; deckB: number; toleranceBpm: number } }
	decks_key_match: { type: 'boolean'; options: { deckA: number; deckB: number } }
	deck_pitch_compare: {
		type: 'boolean'
		options: { deck: number; operator: ComparisonOperator; thresholdPercent: number }
	}
}

export function getComparisonFeedbacks(self: ModuleInstance): CompanionFeedbackDefinitions<ComparisonFeedbacksSchema> {
	const deck = <TKey extends string>(id: TKey, label: string) => deckDropdown(self.config.decks, id, label)

	return {
		deck_bpm_compare: {
			type: 'boolean',
			name: 'Deck BPM Compare',
			description:
				"CONFIRMED (built on `get_bpm`, see docs/VERB_SOURCES.md). Compares one deck's current BPM " +
				'against a fixed threshold, e.g. "BPM > 140".',
			defaultStyle: { bgcolor: combineRgb(230, 100, 0), color: combineRgb(255, 255, 255) },
			options: [
				deck('deck', 'Deck'),
				comparisonOperatorDropdown(),
				{ type: 'number', id: 'threshold', label: 'Threshold BPM', default: 140, min: 0, max: 999, step: 0.1 },
			],
			callback: (feedback) => {
				const bpm = parseVdjNumber(self.state.getDeck(self.clampDeck(feedback.options.deck)).bpm)
				if (bpm === undefined) return false
				return compareNumbers(bpm, feedback.options.operator, feedback.options.threshold)
			},
		},
		decks_bpm_match: {
			type: 'boolean',
			name: 'Two Decks BPM Match',
			description:
				"CONFIRMED (built on `get_bpm`, see docs/VERB_SOURCES.md). True when both decks' current BPM " +
				'are within the given tolerance of each other - handy as a "ready to mix"/"in sync" indicator. ' +
				'Only true once both decks have a track loaded and reporting a BPM.',
			defaultStyle: { bgcolor: combineRgb(0, 153, 76), color: combineRgb(255, 255, 255) },
			options: [
				deck('deckA', 'Deck A'),
				deck('deckB', 'Deck B'),
				{
					type: 'number',
					id: 'toleranceBpm',
					label: 'Tolerance (+/- BPM)',
					default: 0.5,
					min: 0,
					max: 50,
					step: 0.1,
				},
			],
			callback: (feedback) => {
				const bpmA = parseVdjNumber(self.state.getDeck(self.clampDeck(feedback.options.deckA)).bpm)
				const bpmB = parseVdjNumber(self.state.getDeck(self.clampDeck(feedback.options.deckB)).bpm)
				if (bpmA === undefined || bpmB === undefined) return false
				return Math.abs(bpmA - bpmB) <= feedback.options.toleranceBpm
			},
		},
		decks_key_match: {
			type: 'boolean',
			name: 'Two Decks Key Match',
			description:
				"UNCONFIRMED: built on `get_key 'musical'`, which is official-appendix-only (see " +
				'docs/VERB_SOURCES.md) - verify the exact key notation on your VirtualDJ build. True when both ' +
				'decks report the identical key string (exact match, not harmonic/Camelot compatibility). Only ' +
				'true once both decks have a track loaded and reporting a key.',
			defaultStyle: { bgcolor: combineRgb(0, 102, 204), color: combineRgb(255, 255, 255) },
			options: [deck('deckA', 'Deck A'), deck('deckB', 'Deck B')],
			callback: (feedback) => {
				const keyA = parseVdjText(self.state.getDeck(self.clampDeck(feedback.options.deckA)).key)
				const keyB = parseVdjText(self.state.getDeck(self.clampDeck(feedback.options.deckB)).key)
				if (!keyA || !keyB) return false
				return keyA === keyB
			},
		},
		deck_pitch_compare: {
			type: 'boolean',
			name: 'Deck Pitch Compare',
			description:
				'UNCONFIRMED: built on `get_pitch_value`, which is official-appendix-only (see ' +
				"docs/VERB_SOURCES.md). Compares one deck's current pitch percentage against a fixed threshold, " +
				'e.g. "pitch > 105%".',
			defaultStyle: { bgcolor: combineRgb(153, 102, 0), color: combineRgb(255, 255, 255) },
			options: [
				deck('deck', 'Deck'),
				comparisonOperatorDropdown(),
				{
					type: 'number',
					id: 'thresholdPercent',
					label: 'Threshold (%)',
					default: 105,
					min: 0,
					max: 400,
					step: 0.1,
				},
			],
			callback: (feedback) => {
				const pitch = parseVdjNumber(self.state.getDeck(self.clampDeck(feedback.options.deck)).pitch)
				if (pitch === undefined) return false
				return compareNumbers(pitch, feedback.options.operator, feedback.options.thresholdPercent)
			},
		},
	}
}
