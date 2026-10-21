import { beforeEach, describe, expect, it } from 'vitest'
import { makeAttempt, makeSession } from '../test/factories'
import type { PracticeAttempt } from '../types/session'
import { createId } from '../utils/ids'
import {
  MAX_STORED_ATTEMPTS,
  loadAttempts,
  loadSessions,
  loadStatistics,
  saveProgress,
} from './practiceStorage'
import { startSession } from './practiceSession'
import { buildStatistics } from './statisticsService'
import { APPROXIMATE_STORAGE_LIMIT, STORAGE_KEYS, getStorageUsage } from './storageService'

/** A full attempt list, with realistic (UUID) IDs, written straight to storage. */
function seedAttempts(count: number): PracticeAttempt[] {
  const attempts = Array.from({ length: count }, (_, i) => ({
    ...makeAttempt({ correct: i % 4 !== 0 }),
    id: createId(),
    questionId: createId(),
    sessionId: createId(),
  }))
  localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(attempts))
  localStorage.setItem(STORAGE_KEYS.statistics, JSON.stringify(buildStatistics(attempts)))
  return attempts
}

describe('a very large practice history', () => {
  beforeEach(() => localStorage.clear())

  it('fits comfortably in browser storage when full', () => {
    seedAttempts(MAX_STORED_ATTEMPTS)
    const { usedCharacters } = getStorageUsage()
    expect(usedCharacters).toBeGreaterThan(1_000_000) // it really is a lot of data
    expect(usedCharacters).toBeLessThan(APPROXIMATE_STORAGE_LIMIT * 0.6)
  })

  it('loads and saves quickly with thousands of attempts', () => {
    seedAttempts(MAX_STORED_ATTEMPTS)
    const started = performance.now()
    expect(loadAttempts()).toHaveLength(MAX_STORED_ATTEMPTS)
    loadStatistics()
    // Generous limit: this normally takes a few milliseconds.
    expect(performance.now() - started).toBeLessThan(500)
  })

  it('keeps only the newest attempts but never loses the totals', () => {
    seedAttempts(MAX_STORED_ATTEMPTS)
    const before = loadStatistics()

    const empty = startSession({ operations: ['addition'], difficulty: 1, sessionLength: 5 }, {
      ...makeAttempt(),
      id: 'q',
      choices: [1, 2, 3, 4],
      displayText: '1 + 1 = ?',
    } as never)
    const next = {
      ...empty,
      attempts: [makeAttempt({ correct: false, sessionId: empty.session.id })],
    }
    saveProgress(empty, next)

    const attempts = loadAttempts()
    expect(attempts).toHaveLength(MAX_STORED_ATTEMPTS) // details are capped...
    expect(attempts[attempts.length - 1].id).toBe(next.attempts[0].id) // ...oldest dropped first
    const after = loadStatistics()
    expect(after.attempted).toBe(before.attempted + 1) // ...but the totals keep counting
    expect(after.incorrect).toBe(before.incorrect + 1)
  })

  it('shows only a limited number of recent sessions', () => {
    const sessions = Array.from({ length: 100 }, (_, i) =>
      makeSession({ id: `s${i}`, startedAt: new Date(2026, 0, 1 + (i % 28), i).toISOString() }),
    )
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions))
    expect(loadSessions()).toHaveLength(100)
  })
})
