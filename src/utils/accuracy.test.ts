import { describe, expect, it } from 'vitest'
import { calculateAccuracy, encouragement, isAttemptCorrect } from './accuracy'

describe('calculateAccuracy', () => {
  it('returns a rounded percentage', () => {
    expect(calculateAccuracy(7, 10)).toBe(70)
    expect(calculateAccuracy(1, 3)).toBe(33)
    expect(calculateAccuracy(2, 3)).toBe(67)
  })

  it('handles all correct and all incorrect', () => {
    expect(calculateAccuracy(5, 5)).toBe(100)
    expect(calculateAccuracy(0, 5)).toBe(0)
  })

  it('returns null when nothing was attempted', () => {
    expect(calculateAccuracy(0, 0)).toBeNull()
  })
})

describe('encouragement', () => {
  it('is always positive', () => {
    expect(encouragement(null)).toMatch(/ready/i)
    expect(encouragement(100)).toBe('Great job!')
    expect(encouragement(80)).toBe('Great job!')
    expect(encouragement(50)).toBe('Nice work!')
    expect(encouragement(0)).toMatch(/keep practicing/i)
  })
})

describe('isAttemptCorrect', () => {
  it('compares the picked answer with the correct one', () => {
    expect(isAttemptCorrect({ selectedAnswer: 56, correctAnswer: 56 })).toBe(true)
    expect(isAttemptCorrect({ selectedAnswer: 54, correctAnswer: 56 })).toBe(false)
  })
})
