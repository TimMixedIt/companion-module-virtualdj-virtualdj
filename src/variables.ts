import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type ModuleInstance from './main.js'

export type VariablesSchema = CompanionVariableValues

const PER_DECK_FIELDS: { suffix: string; label: string }[] = [
	{ suffix: 'title', label: 'Title' },
	{ suffix: 'artist', label: 'Artist' },
	{ suffix: 'bpm', label: 'BPM' },
	{ suffix: 'remaining', label: 'Remaining Time' },
	{ suffix: 'pitch', label: 'Pitch' },
	{ suffix: 'key', label: 'Key' },
]

export function deckVariableId(deck: number, suffix: string): string {
	return `deck${deck}_${suffix}`
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const definitions: Record<string, CompanionVariableDefinition> = {}

	for (let deck = 1; deck <= self.config.decks; deck++) {
		for (const field of PER_DECK_FIELDS) {
			definitions[deckVariableId(deck, field.suffix)] = { name: `Deck ${deck}: ${field.label}` }
		}
	}

	definitions['active_deck'] = { name: 'Active (playing) Deck Number' }
	for (const field of PER_DECK_FIELDS) {
		definitions[`active_${field.suffix}`] = { name: `Active (playing) Deck: ${field.label}` }
	}

	definitions['crossfader_position'] = { name: 'Crossfader Position (0-100)' }
	definitions['automix_active'] = { name: 'Automix Active (yes/no)' }
	definitions['record_time'] = { name: 'Recording Time' }

	self.setVariableDefinitions(definitions)
	refreshVariableValues(self)
}

/** Pushes the current cached state into Companion's variable values. Call after every poll pass. */
export function refreshVariableValues(self: ModuleInstance): void {
	const values: CompanionVariableValues = {}

	for (let deck = 1; deck <= self.config.decks; deck++) {
		const deckState = self.state.getDeck(deck)
		values[deckVariableId(deck, 'title')] = deckState.title
		values[deckVariableId(deck, 'artist')] = deckState.artist
		values[deckVariableId(deck, 'bpm')] = deckState.bpm
		values[deckVariableId(deck, 'remaining')] = deckState.remainingTime
		values[deckVariableId(deck, 'pitch')] = deckState.pitch
		values[deckVariableId(deck, 'key')] = deckState.key
	}

	const activeDeck = self.state.updateActiveDeck(self.config.decks)
	values['active_deck'] = activeDeck
	for (const field of PER_DECK_FIELDS) {
		values[`active_${field.suffix}`] = values[deckVariableId(activeDeck, field.suffix)]
	}

	values['crossfader_position'] = self.state.global.crossfader ?? ''
	values['automix_active'] = self.state.global.automixActive ? 'yes' : 'no'
	values['record_time'] = self.state.global.recordTime

	self.setVariableValues(values)
}
