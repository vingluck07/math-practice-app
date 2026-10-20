import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeAttempt as makeTestAttempt, makeSession as makeTestSession } from '../test/factories'
import { fillStorage } from '../test/storageHelpers'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import {
  MAX_STORED_ATTEMPTS,
  clearPracticeHistory,
  loadStatistics,
  MAX_STORED_SESSIONS,
  loadAttempts,
  loadSessions,
  saveAttempt,
  saveProgress,
  saveSession,
} from './practiceStorage'
import { startSession, recordResult, endSession } from './practiceSession'
import { createEmptyStatistics } from './statisticsService'
import { STORAGE_KEYS } from './storageService'

afterEach(() => vi.restoreAllMocks())

function makeSession(n: number, overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: `s${n}`,
    startedAt: new Date(Date.UTC(2026, 9, 1, 12, 0, n)).toISOString(),
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 10,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    ...overrides,
  }
}

function makeAttempt(n: number, overrides: Partial<PracticeAttempt> = {}): PracticeAttempt {
  return {
    id: `a${n}`,
    questionId: `q${n}`,
    operation: 'multiplication',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    selectedAnswer: 54,
    selfReportedCorrect: false,
    difficulty: 2,
    source: 'regular',
    attemptedAt: new Date(Date.UTC(2026, 9, 1, 12, 0, n)).toISOString(),
    sessionId: 's1',
    ...overrides,
  }
}

describe('sessions', () => {
  it('saves a session and loads it back', () => {
    expect(saveSession(makeSession(1))).toEqual({ ok: true })
    expect(loadSessions()).toEqual([makeSession(1)])
  })

  it('updates the same session instead of duplicating it, including completion details', () => {
    saveSession(makeSession(1))
    const done = makeSession(1, {
      attempted: 10,
      correct: 7,
      incorrect: 3,
      completedAt: '2026-10-01T12:10:00.000Z',
    })
    saveSession(done)
    expect(loadSessions()).toEqual([done])
  })

  it('loads the most recent sessions first, up to a limit', () => {
    for (let n = 1; n <= 5; n++) saveSession(makeSession(n))
    expect(loadSessions(3).map((s) => s.id)).toEqual(['s5', 's4', 's3'])
  })

  it('keeps only the newest sessions when there are too many', () => {
    for (let n = 1; n <= MAX_STORED_SESSIONS + 5; n++) saveSession(makeSession(n))
    const stored = loadSessions()
    expect(stored).toHaveLength(MAX_STORED_SESSIONS)
    expect(stored.map((s) => s.id)).not.toContain('s1')
    expect(stored[0].id).toBe(`s${MAX_STORED_SESSIONS + 5}`)
  })

  it('skips damaged entries', () => {
    localStorage.setItem(
      STORAGE_KEYS.sessions,
      JSON.stringify([makeSession(1), { id: 'bad' }, 'junk', null, makeSession(2)]),
    )
    expect(loadSessions().map((s) => s.id)).toEqual(['s2', 's1'])
  })

  it('treats damaged storage as empty', () => {
    localStorage.setItem(STORAGE_KEYS.sessions, '{not json')
    expect(loadSessions()).toEqual([])
  })
})

describe('attempts', () => {
  it('saves every field of an attempt', () => {
    const attempt = makeAttempt(1)
    expect(saveAttempt(attempt)).toEqual({ ok: true })
    const [stored] = loadAttempts()
    expect(stored).toEqual(attempt)
    expect(stored).toMatchObject({
      selectedAnswer: 54,
      selfReportedCorrect: false,
      operation: 'multiplication',
      difficulty: 2,
      sessionId: 's1',
    })
    expect(stored.attemptedAt).toBeTruthy()
  })

  it('keeps attempts in order and ignores a duplicate ID', () => {
    saveAttempt(makeAttempt(1))
    saveAttempt(makeAttempt(2))
    saveAttempt(makeAttempt(1))
    expect(loadAttempts().map((a) => a.id)).toEqual(['a1', 'a2'])
  })

  it('persists in browser storage, so it survives a restart', () => {
    saveAttempt(makeAttempt(1))
    // A new page load only has what is in localStorage.
    const raw = localStorage.getItem(STORAGE_KEYS.attempts)
    expect(JSON.parse(raw ?? '[]')).toHaveLength(1)
    expect(loadAttempts()).toHaveLength(1)
  })

  it('keeps only the newest attempts when there are too many', () => {
    const many = Array.from({ length: MAX_STORED_ATTEMPTS + 3 }, (_, i) => makeAttempt(i))
    localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(many))
    saveAttempt(makeAttempt(99999))
    const stored = loadAttempts()
    expect(stored).toHaveLength(MAX_STORED_ATTEMPTS)
    expect(stored[stored.length - 1].id).toBe('a99999')
  })

  it('skips damaged entries', () => {
    localStorage.setItem(
      STORAGE_KEYS.attempts,
      JSON.stringify([makeAttempt(1), { ...makeAttempt(2), operation: 'power' }, 5]),
    )
    expect(loadAttempts().map((a) => a.id)).toEqual(['a1'])
  })
})

describe('when storage is full', () => {
  it('reports the failure instead of throwing', () => {
    fillStorage()
    expect(saveAttempt(makeAttempt(1))).toEqual({ ok: false, reason: 'quota-exceeded' })
    expect(saveSession(makeSession(1))).toEqual({ ok: false, reason: 'quota-exceeded' })
  })

  it('drops the oldest records once and retries', () => {
    const many = Array.from({ length: 50 }, (_, i) => makeAttempt(i))
    localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(many))
    const original = Storage.prototype.setItem
    let failures = 1
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k, v) {
      if (failures-- > 0) throw new DOMException('full', 'QuotaExceededError')
      return original.call(this, k, v)
    })
    expect(saveAttempt(makeAttempt(1000))).toEqual({ ok: true })
    const stored = loadAttempts()
    expect(stored.length).toBeLessThan(51)
    expect(stored[stored.length - 1].id).toBe('a1000')
    expect(stored.map((a) => a.id)).not.toContain('a0')
  })
})

describe('saveProgress', () => {
  const config = {
    operations: ['multiplication' as const],
    difficulty: 2 as const,
    sessionLength: 5,
  }
  const question = {
    id: 'q1',
    operation: 'multiplication' as const,
    firstOperand: 7,
    secondOperand: 8,
    displayText: '7 × 8 = ?',
    correctAnswer: 56,
    choices: [48, 54, 56, 64],
    difficulty: 2 as const,
    source: 'regular' as const,
  }

  it('saves a new attempt together with the updated session totals', () => {
    const start = startSession(config, question)
    const recorded = recordResult(start, true, 56)
    expect(saveProgress(start, recorded)).toEqual({ ok: true })
    expect(loadAttempts()).toHaveLength(1)
    expect(loadSessions()[0]).toMatchObject({ attempted: 1, correct: 1 })
  })

  it('saves the completion time when the session ends', () => {
    const recorded = recordResult(startSession(config, question), true, 56)
    const ended = endSession(recorded)
    saveProgress(recorded, ended)
    expect(loadSessions()[0].completedAt).toBeTruthy()
    expect(loadAttempts()).toHaveLength(0)
  })

  it('saves nothing when nothing changed', () => {
    const start = startSession(config, question)
    saveProgress(start, start)
    expect(loadSessions()).toEqual([])
    expect(loadAttempts()).toEqual([])
  })
})

describe('statistics storage', () => {
  const config = {
    operations: ['multiplication' as const],
    difficulty: 2 as const,
    sessionLength: 5,
  }
  const question = {
    id: 'q1',
    operation: 'multiplication' as const,
    firstOperand: 7,
    secondOperand: 8,
    displayText: '7 × 8 = ?',
    correctAnswer: 56,
    choices: [48, 54, 56, 64],
    difficulty: 2 as const,
    source: 'regular' as const,
  }

  it('is empty when nothing has been saved', () => {
    expect(loadStatistics()).toMatchObject({ attempted: 0, correct: 0, incorrect: 0 })
  })

  it('counts each recorded attempt once, by the picked answer', () => {
    const start = startSession(config, question)
    const right = recordResult(start, false, 56)
    saveProgress(start, right)
    const wrong = recordResult({ ...right, currentQuestion: { ...question, id: 'q2' } }, true, 48)
    saveProgress({ ...right, currentQuestion: { ...question, id: 'q2' } }, wrong)

    const stats = loadStatistics()
    expect(stats).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 })
    expect(stats.byOperation.multiplication).toMatchObject({ attempted: 2, correct: 1 })
    expect(stats.byDifficulty[2]).toMatchObject({ attempted: 2, incorrect: 1 })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.statistics) ?? '{}').attempted).toBe(2)
  })

  it('rebuilds from saved attempts when the totals are missing, without double counting', () => {
    saveAttempt(makeTestAttempt({ correct: true }))
    saveAttempt(makeTestAttempt({ correct: false }))
    expect(loadStatistics()).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 })

    const start = startSession(config, question)
    saveProgress(start, recordResult(start, true, 56))
    expect(loadStatistics()).toMatchObject({ attempted: 3, correct: 2, incorrect: 1 })
  })

  it('rebuilds from saved attempts when the totals are damaged', () => {
    saveAttempt(makeTestAttempt({ correct: true }))
    localStorage.setItem(STORAGE_KEYS.statistics, JSON.stringify({ attempted: 'lots' }))
    expect(loadStatistics()).toMatchObject({ attempted: 1, correct: 1 })
    localStorage.setItem(STORAGE_KEYS.statistics, '{broken')
    expect(loadStatistics()).toMatchObject({ attempted: 1, correct: 1 })
  })

  it('rejects totals that do not add up', () => {
    saveAttempt(makeTestAttempt({ correct: true }))
    const lying = createEmptyStatistics()
    lying.attempted = 50
    localStorage.setItem(STORAGE_KEYS.statistics, JSON.stringify(lying))
    expect(loadStatistics().attempted).toBe(1)
  })
})

describe('clearPracticeHistory', () => {
  it('erases history but keeps settings and other apps’ data', () => {
    saveAttempt(makeTestAttempt())
    saveSession(makeTestSession())
    localStorage.setItem(STORAGE_KEYS.statistics, JSON.stringify(createEmptyStatistics()))
    localStorage.setItem(STORAGE_KEYS.mistakePatterns, '[]')
    localStorage.setItem(STORAGE_KEYS.settings, '{"cardAnimationEnabled":false}')
    localStorage.setItem(STORAGE_KEYS.version, '{"version":1}')
    localStorage.setItem('someOtherApp.theme', 'dark')

    expect(clearPracticeHistory()).toBe(true)
    for (const key of ['attempts', 'sessions', 'statistics', 'mistakePatterns'] as const) {
      expect(localStorage.getItem(STORAGE_KEYS[key])).toBeNull()
    }
    expect(localStorage.getItem(STORAGE_KEYS.settings)).not.toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.version)).not.toBeNull()
    expect(localStorage.getItem('someOtherApp.theme')).toBe('dark')
    expect(loadStatistics().attempted).toBe(0)
  })
})
