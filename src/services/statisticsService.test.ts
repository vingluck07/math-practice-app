import { describe, expect, it } from 'vitest'
import { makeAttempt, makeSession } from '../test/factories'
import {
  accuracyOf,
  addAttemptToStatistics,
  buildStatistics,
  createEmptyStatistics,
  recentSessionSummaries,
} from './statisticsService'

describe('createEmptyStatistics', () => {
  it('has zero totals for every operation and level', () => {
    const stats = createEmptyStatistics()
    expect(stats).toMatchObject({ attempted: 0, correct: 0, incorrect: 0 })
    for (const op of ['addition', 'subtraction', 'multiplication', 'division'] as const) {
      expect(stats.byOperation[op]).toEqual({ attempted: 0, correct: 0, incorrect: 0 })
    }
    for (const level of [1, 2, 3, 4] as const) {
      expect(stats.byDifficulty[level]).toEqual({ attempted: 0, correct: 0, incorrect: 0 })
    }
  })
})

describe('addAttemptToStatistics', () => {
  it('counts a correct answer', () => {
    const stats = addAttemptToStatistics(createEmptyStatistics(), makeAttempt({ correct: true }))
    expect(stats).toMatchObject({ attempted: 1, correct: 1, incorrect: 0 })
  })

  it('counts an incorrect answer', () => {
    const stats = addAttemptToStatistics(createEmptyStatistics(), makeAttempt({ correct: false }))
    expect(stats).toMatchObject({ attempted: 1, correct: 0, incorrect: 1 })
  })

  it('uses the picked answer, not the "how do you think you did" response', () => {
    const wrongButConfident = makeAttempt({ correct: false, confident: true })
    const rightButUnsure = makeAttempt({ correct: true, confident: false })
    const stats = buildStatistics([wrongButConfident, rightButUnsure])
    expect(stats).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 })
  })

  it('tracks each operation separately', () => {
    const stats = buildStatistics([
      makeAttempt({ operation: 'addition' }),
      makeAttempt({ operation: 'subtraction', correct: false }),
      makeAttempt({ operation: 'multiplication' }),
      makeAttempt({ operation: 'division', correct: false }),
      makeAttempt({ operation: 'division' }),
    ])
    expect(stats.byOperation.addition).toEqual({ attempted: 1, correct: 1, incorrect: 0 })
    expect(stats.byOperation.subtraction).toEqual({ attempted: 1, correct: 0, incorrect: 1 })
    expect(stats.byOperation.multiplication).toEqual({ attempted: 1, correct: 1, incorrect: 0 })
    expect(stats.byOperation.division).toEqual({ attempted: 2, correct: 1, incorrect: 1 })
  })

  it('tracks each difficulty level separately', () => {
    const stats = buildStatistics([
      makeAttempt({ difficulty: 1 }),
      makeAttempt({ difficulty: 2, correct: false }),
      makeAttempt({ difficulty: 3 }),
      makeAttempt({ difficulty: 4, correct: false }),
      makeAttempt({ difficulty: 4 }),
    ])
    expect(stats.byDifficulty[1]).toEqual({ attempted: 1, correct: 1, incorrect: 0 })
    expect(stats.byDifficulty[2]).toEqual({ attempted: 1, correct: 0, incorrect: 1 })
    expect(stats.byDifficulty[3]).toEqual({ attempted: 1, correct: 1, incorrect: 0 })
    expect(stats.byDifficulty[4]).toEqual({ attempted: 2, correct: 1, incorrect: 1 })
  })

  it('does not change the statistics it was given', () => {
    const before = createEmptyStatistics()
    addAttemptToStatistics(before, makeAttempt())
    expect(before).toEqual(createEmptyStatistics())
  })

  it('keeps the overall totals equal to the sum of the groups', () => {
    const stats = buildStatistics(
      Array.from({ length: 40 }, (_, i) =>
        makeAttempt({
          operation: (['addition', 'subtraction', 'multiplication', 'division'] as const)[i % 4],
          difficulty: ((i % 4) + 1) as 1 | 2 | 3 | 4,
          correct: i % 3 !== 0,
        }),
      ),
    )
    const sum = (groups: { attempted: number }[]) => groups.reduce((n, g) => n + g.attempted, 0)
    expect(sum(Object.values(stats.byOperation))).toBe(stats.attempted)
    expect(sum(Object.values(stats.byDifficulty))).toBe(stats.attempted)
    expect(stats.attempted).toBe(stats.correct + stats.incorrect)
  })
})

describe('accuracyOf', () => {
  it('is a rounded percentage', () => {
    expect(accuracyOf({ attempted: 3, correct: 2, incorrect: 1 })).toBe(67)
    expect(accuracyOf({ attempted: 4, correct: 4, incorrect: 0 })).toBe(100)
    expect(accuracyOf({ attempted: 4, correct: 0, incorrect: 4 })).toBe(0)
  })

  it('handles zero attempts without dividing by zero', () => {
    expect(accuracyOf({ attempted: 0, correct: 0, incorrect: 0 })).toBeNull()
    expect(accuracyOf(createEmptyStatistics())).toBeNull()
  })
})

describe('recentSessionSummaries', () => {
  it('sorts newest first and adds accuracy', () => {
    const old = makeSession({ id: 'old', startedAt: '2026-09-01T10:00:00.000Z' })
    const recent = makeSession({
      id: 'recent',
      startedAt: '2026-10-05T10:00:00.000Z',
      attempted: 3,
      correct: 1,
      incorrect: 2,
    })
    const summaries = recentSessionSummaries([old, recent])
    expect(summaries.map((s) => s.id)).toEqual(['recent', 'old'])
    expect(summaries[0].accuracy).toBe(33)
    expect(summaries[1].accuracy).toBe(75)
  })

  it('skips sessions with no answered questions', () => {
    const empty = makeSession({ id: 'empty', attempted: 0, correct: 0, incorrect: 0 })
    expect(recentSessionSummaries([empty])).toEqual([])
  })

  it('limits how many are returned', () => {
    const sessions = Array.from({ length: 15 }, (_, i) =>
      makeSession({ id: `s${i}`, startedAt: new Date(Date.UTC(2026, 9, 1 + i)).toISOString() }),
    )
    expect(recentSessionSummaries(sessions, 10)).toHaveLength(10)
    expect(recentSessionSummaries(sessions, 10)[0].id).toBe('s14')
  })
})
