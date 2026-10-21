import { describe, expect, it } from 'vitest'
import { startSession, recordResult } from './practiceSession'
import { clearPracticeHistory } from './practiceStorage'
import { STORAGE_KEYS } from './storageService'
import {
  ACTIVE_SESSION_MAX_AGE_MS,
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from './activeSessionStorage'
import type { Question } from '../types/question'
import type { PracticeConfig } from '../types/session'

const config: PracticeConfig = { operations: ['addition'], difficulty: 1, sessionLength: 10 }
const question: Question = {
  id: 'q1',
  operation: 'addition',
  firstOperand: 3,
  secondOperand: 4,
  displayText: '3 + 4 = ?',
  correctAnswer: 7,
  choices: [6, 7, 8, 9],
  difficulty: 1,
  source: 'regular',
}

const fresh = () => startSession(config, question)
const raw = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.activeSession) ?? 'null')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const poke = (change: (record: Record<string, any>) => void) => {
  const record = raw()
  change(record)
  localStorage.setItem(STORAGE_KEYS.activeSession, JSON.stringify(record))
}

describe('active session storage', () => {
  it('has nothing saved at first', () => {
    expect(loadActiveSession()).toBeNull()
  })

  it('saves and loads a running session with its picked answer', () => {
    const state = recordResult(fresh(), true, 7)
    expect(saveActiveSession({ config, state, selectedAnswer: 7 })).toEqual({ ok: true })
    const loaded = loadActiveSession()
    expect(loaded?.state).toEqual(state)
    expect(loaded?.config).toEqual(config)
    expect(loaded?.selectedAnswer).toBe(7)
  })

  it('replaces the earlier copy', () => {
    saveActiveSession({ config, state: fresh(), selectedAnswer: null })
    const later = recordResult(fresh(), true, 7)
    saveActiveSession({ config, state: later, selectedAnswer: null })
    expect(loadActiveSession()?.state.session.attempted).toBe(1)
  })

  it('clears it', () => {
    saveActiveSession({ config, state: fresh(), selectedAnswer: null })
    expect(clearActiveSession()).toBe(true)
    expect(loadActiveSession()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.activeSession)).toBeNull()
  })

  it('is cleared along with the rest of the practice history', () => {
    saveActiveSession({ config, state: fresh(), selectedAnswer: null })
    clearPracticeHistory()
    expect(loadActiveSession()).toBeNull()
  })

  it('removes and ignores a session that is too old', () => {
    saveActiveSession({ config, state: fresh(), selectedAnswer: null })
    const later = new Date(Date.now() + ACTIVE_SESSION_MAX_AGE_MS + 60_000)
    expect(loadActiveSession(later)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.activeSession)).toBeNull()
  })

  it.each([
    ['broken JSON', () => localStorage.setItem(STORAGE_KEYS.activeSession, '{oops')],
    ['not an object', () => localStorage.setItem(STORAGE_KEYS.activeSession, '[1]')],
    ['a finished session', () => poke((r) => (r.state.isActive = false))],
    ['an unreadable question', () => poke((r) => (r.state.currentQuestion.choices = [1, 1, 1, 1]))],
    [
      'a question with the wrong answer',
      () => poke((r) => (r.state.currentQuestion.correctAnswer = 99)),
    ],
    ['a missing session', () => poke((r) => delete r.state.session)],
    ['attempt counts that do not add up', () => poke((r) => (r.state.session.attempted = 5))],
    ['an invalid setup', () => poke((r) => (r.config.operations = []))],
    ['a picked answer that is not a choice', () => poke((r) => (r.selectedAnswer = 1234))],
    ['a missing save time', () => poke((r) => delete r.savedAt)],
  ])('removes and ignores a damaged save: %s', (_, damage) => {
    saveActiveSession({ config, state: fresh(), selectedAnswer: null })
    damage()
    expect(loadActiveSession()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.activeSession)).toBeNull()
  })
})
