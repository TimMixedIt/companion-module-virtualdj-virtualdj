import type { CompanionInputFieldDropdown, CompanionInputFieldNumber } from '@companion-module/base'
import { FX_SLOTS, HOTCUE_SLOTS } from './state.js'
import { MAX_DECKS } from './config.js'

/**
 * Deck dropdown, built from the currently configured deck count. Actions and
 * feedbacks are re-registered whenever `decks` changes (see
 * ModuleInstance.configUpdated), so this always reflects the live count; the
 * deck number is still clamped defensively at execution time in case a
 * button was configured before the deck count was lowered.
 */
export function deckDropdown<TKey extends string = 'deck'>(
	decks: number,
	id: TKey = 'deck' as TKey,
	label = 'Deck',
): CompanionInputFieldDropdown<TKey, number> {
	return {
		type: 'dropdown',
		id,
		label,
		default: 1,
		choices: Array.from({ length: Math.min(decks, MAX_DECKS) }, (_, i) => ({ id: i + 1, label: `Deck ${i + 1}` })),
	}
}

export function fxSlotDropdown<TKey extends string = 'slot'>(
	id: TKey = 'slot' as TKey,
	label = 'FX Slot',
): CompanionInputFieldDropdown<TKey, number> {
	return {
		type: 'dropdown',
		id,
		label,
		default: 1,
		choices: Array.from({ length: FX_SLOTS }, (_, i) => ({ id: i + 1, label: `FX Slot ${i + 1}` })),
	}
}

export function hotCueDropdown<TKey extends string = 'slot'>(
	id: TKey = 'slot' as TKey,
	label = 'Hot Cue',
): CompanionInputFieldDropdown<TKey, number> {
	return {
		type: 'dropdown',
		id,
		label,
		default: 1,
		choices: Array.from({ length: HOTCUE_SLOTS }, (_, i) => ({ id: i + 1, label: `Hot Cue ${i + 1}` })),
	}
}

export function percentNumber<TKey extends string>(
	id: TKey,
	label: string,
	defaultValue = 50,
): CompanionInputFieldNumber<TKey> {
	return {
		type: 'number',
		id,
		label,
		default: defaultValue,
		min: 0,
		max: 100,
		range: true,
		clampValues: true,
	}
}
