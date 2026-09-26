import { describe, expect, it } from 'vitest'
import { pickActiveDeck } from '../src/state.js'

describe('pickActiveDeck', () => {
	it('picks the only playing deck', () => {
		expect(pickActiveDeck([false, true], 0, 1)).toBe(2)
		expect(pickActiveDeck([true, false], 100, 2)).toBe(1)
	})

	it('keeps the previous deck while nothing plays', () => {
		expect(pickActiveDeck([false, false], 50, 2)).toBe(2)
	})

	it('follows the crossfader when several decks play', () => {
		expect(pickActiveDeck([true, true], 10, 2)).toBe(1)
		expect(pickActiveDeck([true, true], 90, 1)).toBe(2)
		expect(pickActiveDeck([true, true, true, false], 90, 1)).toBe(2)
		expect(pickActiveDeck([true, false, true, false], 10, 3)).toBe(3)
	})

	it('keeps the previous deck with the crossfader centred', () => {
		expect(pickActiveDeck([true, true], 50, 2)).toBe(2)
		expect(pickActiveDeck([true, true], undefined, 1)).toBe(1)
	})

	it('falls back to deck 1 if the previous deck no longer exists', () => {
		expect(pickActiveDeck([false, false], 50, 4)).toBe(1)
	})
})
