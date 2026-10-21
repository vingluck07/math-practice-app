import { describe, expect, it } from 'vitest'
import { makeAttempt, makePattern } from '../test/factories'
import {
  buildMistakeStatistics,
  mostMissedOperations,
  sortByIncorrectCount,
} from './mistakeStatistics'

const p = (id: string, overrides: Parameters<typeof makePattern>[0] = {}) =>
  makePattern({ id, ...overrides })

describe('sortByIncorrectCount', () => {
  it('puts the most missed first', () => {
    const sorted = sortByIncorrectCount([
      p('a', { incorrectCount: 1 }),
      p('b', { incorrectCount: 4 }),
      p('c', { incorrectCount: 2 }),
    ])
    expect(sorted.map((x) => x.id)).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties by most recent miss, then by ID', () => {
    const sorted = sortByIncorrectCount([
      p('old', { incorrectCount: 2, lastIncorrectAt: '2026-09-01T00:00:00.000Z' }),
      p('z', { incorrectCount: 2, lastIncorrectAt: '2026-10-01T00:00:00.000Z' }),
      p('a', { incorrectCount: 2, lastIncorrectAt: '2026-10-01T00:00:00.000Z' }),
    ])
    expect(sorted.map((x) => x.id)).toEqual(['a', 'z', 'old'])
  })

  it('does not change the list it is given', () => {
    const list = [p('a', { incorrectCount: 1 }), p('b', { incorrectCount: 3 })]
    sortByIncorrectCount(list)
    expect(list.map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('mostMissedOperations', () => {
  it('adds up every miss of every mistake for each operation', () => {
    const result = mostMissedOperations([
      p('a', { operation: 'addition', incorrectCount: 1 }),
      p('b', { operation: 'addition', incorrectCount: 1 }),
      p('c', { operation: 'division', incorrectCount: 3 }),
    ])
    expect(result).toEqual({ operations: ['division'], misses: 3 })
  })

  it('lists every operation in a tie, in the usual order', () => {
    const result = mostMissedOperations([
      p('a', { operation: 'division', incorrectCount: 2 }),
      p('b', { operation: 'addition', incorrectCount: 2 }),
      p('c', { operation: 'subtraction', incorrectCount: 1 }),
    ])
    expect(result).toEqual({ operations: ['addition', 'division'], misses: 2 })
  })

  it('is null when there are no mistakes', () => {
    expect(mostMissedOperations([])).toBeNull()
  })
})

describe('buildMistakeStatistics', () => {
  it('counts active and mastered mistakes', () => {
    const stats = buildMistakeStatistics([p('a'), p('b'), p('c', { mastered: true })], [])
    expect(stats).toMatchObject({ activeCount: 2, masteredCount: 1 })
  })

  it('counts review questions and the ones answered correctly', () => {
    const stats = buildMistakeStatistics(
      [p('a')],
      [
        makeAttempt({ source: 'mistake-review', correct: true }),
        makeAttempt({ source: 'mistake-review', correct: true, confident: false }),
        makeAttempt({ source: 'mistake-review', correct: false }),
        makeAttempt({ source: 'regular', correct: true }),
      ],
    )
    expect(stats.reviewAttempted).toBe(3)
    expect(stats.reviewCorrect).toBe(2)
  })

  it('keeps only the most frequently missed facts', () => {
    const patterns = Array.from({ length: 8 }, (_, i) => p(`p${i}`, { incorrectCount: i + 1 }))
    const stats = buildMistakeStatistics(patterns, [])
    expect(stats.frequentlyMissed.map((x) => x.id)).toEqual(['p7', 'p6', 'p5', 'p4', 'p3'])
  })

  it('is all zeros and empty with no data', () => {
    expect(buildMistakeStatistics([], [])).toEqual({
      activeCount: 0,
      masteredCount: 0,
      reviewAttempted: 0,
      reviewCorrect: 0,
      mostMissedOperations: null,
      frequentlyMissed: [],
    })
  })
})
