import { describe, expect, it } from 'vitest'
import { seededRng } from '../test/helpers'
import { formatQuestionText, pickRandom, randomInt } from './math'

describe('randomInt', () => {
  it('returns the minimum when the generator returns 0', () => {
    expect(randomInt(3, 9, () => 0)).toBe(3)
  })

  it('returns the maximum when the generator is just below 1', () => {
    expect(randomInt(3, 9, () => 0.999999)).toBe(9)
    expect(randomInt(3, 9, () => 1)).toBe(9)
  })

  it('stays within bounds and reaches both ends', () => {
    const rng = seededRng(1)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const n = randomInt(0, 5, rng)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(5)
      seen.add(n)
    }
    expect(seen.size).toBe(6)
  })

  it('handles a single-value range', () => {
    expect(randomInt(7, 7)).toBe(7)
  })

  it('rejects invalid bounds', () => {
    expect(() => randomInt(5, 1)).toThrow(RangeError)
    expect(() => randomInt(1.5, 3)).toThrow(RangeError)
  })
})

describe('pickRandom', () => {
  it('returns an element of the array', () => {
    const items = ['a', 'b', 'c']
    for (let i = 0; i < 50; i++) expect(items).toContain(pickRandom(items))
  })

  it('throws for an empty array', () => {
    expect(() => pickRandom([])).toThrow(RangeError)
  })
})

describe('formatQuestionText', () => {
  it('uses the right symbol for each operation', () => {
    expect(formatQuestionText('addition', 2, 3)).toBe('2 + 3 = ?')
    expect(formatQuestionText('subtraction', 5, 3)).toBe('5 − 3 = ?')
    expect(formatQuestionText('multiplication', 8, 7)).toBe('8 × 7 = ?')
    expect(formatQuestionText('division', 56, 7)).toBe('56 ÷ 7 = ?')
  })
})
