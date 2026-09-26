import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type ModuleInstance from '../main.js'
import { MAX_DECKS } from '../config.js'
import { pitchDeviationPercent, renderPitchBarPng64 } from '../pitchBar.js'

export type PitchBarFeedbacksSchema = {
	deck_pitch_bar: {
		type: 'advanced'
		options: {
			deck: number
			rangePercent: number
			direction: 'up' | 'down'
			fasterColor: number
			slowerColor: number
		}
	}
}

/** Default button size when Companion doesn't tell us the size to draw at. */
const DEFAULT_SIZE = 72

export function getPitchBarFeedbacks(self: ModuleInstance): CompanionFeedbackDefinitions<PitchBarFeedbacksSchema> {
	return {
		deck_pitch_bar: {
			type: 'advanced',
			name: 'Deck Pitch Bar (background)',
			description:
				'Draws a pitch-fader style bar as the button background: black with a centre line, the bar ' +
				'grows from the centre like the pitch fader - down when the track plays faster than its original ' +
				'tempo, up when slower (flip it with "Faster grows"). Button ' +
				'text stays on top, so it also works behind a deck title/BPM button. UNCONFIRMED: built on ' +
				'`get_pitch_value` (see docs/VERB_SOURCES.md).',
			options: [
				{
					type: 'dropdown',
					id: 'deck',
					label: 'Deck',
					default: 0,
					choices: [
						{ id: 0, label: 'Active (playing) deck' },
						...Array.from({ length: Math.min(self.config.decks, MAX_DECKS) }, (_, i) => ({
							id: i + 1,
							label: `Deck ${i + 1}`,
						})),
					],
				},
				{
					type: 'number',
					id: 'rangePercent',
					label: 'Full bar at +/- % (match your VirtualDJ pitch range)',
					default: 8,
					min: 1,
					max: 100,
					step: 1,
				},
				{
					type: 'dropdown',
					id: 'direction',
					label: 'Faster grows',
					default: 'down',
					choices: [
						{ id: 'down', label: 'Down (like the VirtualDJ pitch fader)' },
						{ id: 'up', label: 'Up' },
					],
				},
				{ type: 'colorpicker', id: 'fasterColor', label: 'Faster colour', default: combineRgb(0, 170, 0) },
				{ type: 'colorpicker', id: 'slowerColor', label: 'Slower colour', default: combineRgb(200, 0, 0) },
			],
			callback: (feedback) => {
				const { options } = feedback
				const deck = Number(options.deck) === 0 ? self.state.global.activeDeck : self.clampDeck(Number(options.deck))
				return {
					png64: renderPitchBarPng64({
						width: feedback.image?.width ?? DEFAULT_SIZE,
						height: feedback.image?.height ?? DEFAULT_SIZE,
						deviation: pitchDeviationPercent(self.state.getDeck(deck).pitch),
						rangePercent: Number(options.rangePercent),
						fasterColor: Number(options.fasterColor),
						slowerColor: Number(options.slowerColor),
						fasterIsUp: options.direction === 'up',
					}),
					pngalignment: 'center:center',
				}
			},
		},
	}
}
