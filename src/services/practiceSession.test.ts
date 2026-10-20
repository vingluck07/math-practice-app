import { describe, expect, it } from 'vitest'
import type { Question } from '../types/question'
import type { PracticeConfig } from '../types/session'
import {
  advance,
  endSession,
  hasRecordedCurrentQuestion,
  isLastQuestion,
  recordResult,
  startSession,
} from './practiceSession'

function makeQuestion(id: string): Question {
  return {
    id,
    operation: 'multiplication',
    firstOperand: 7,
    secondOperand: 8,
    displayText: '7 × 8 = ?',
    correctAnswer: 56,
    choices: [48, 54, 56, 64],
    difficulty: 2,
    source: 'regular',
  }
}

const config: PracticeConfig = {
  operations: ['multiplication', 'division'],
  difficulty: 2,
  sessionLength: 2,
}
const now = new Date('2026-10-20T12:00:00Z')

describe('startSession', () => {
  it('stores the setup, an ID, and empty totals', () => {
    const state = startSession(config, makeQuestion('q1'), now)
    expect(state.session.id).toBeTruthy()
    expect(state.session.startedAt).toBe('2026-10-20T12:00:00.000Z')
    expect(state.session.operations).toEqual(['multiplication', 'division'])
    expect(state.session.difficulty).toBe(2)
    expect(state.session.sessionLength).toBe(2)
    expect(state.session).toMatchObject({ attempted: 0, correct: 0, incorrect: 0 })
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.currentQuestion.id).toBe('q1')
    expect(state.attempts).toEqual([])
    expect(state.isActive).toBe(true)
  })
})

describe('recordResult', () => {
  it('stores a complete attempt and updates the totals', () => {
    const start = startSession(config, makeQuestion('q1'), now)
    const state = recordResult(start, true, 54, now)
    expect(state.attempts).toHaveLength(1)
    expect(state.attempts[0]).toMatchObject({
      questionId: 'q1',
      operation: 'multiplication',
      firstOperand: 7,
      secondOperand: 8,
      correctAnswer: 56,
      selectedAnswer: 54,
      selfReportedCorrect: true,
      difficulty: 2,
      source: 'regular',
      sessionId: start.session.id,
      attemptedAt: '2026-10-20T12:00:00.000Z',
    })
    expect(state.session).toMatchObject({ attempted: 1, correct: 1, incorrect: 0 })
    expect(hasRecordedCurrentQuestion(state)).toBe(true)
  })

  it('counts an "I got it wrong" as incorrect', () => {
    const state = recordResult(startSession(config, makeQuestion('q1')), false, 48)
    expect(state.session).toMatchObject({ attempted: 1, correct: 0, incorrect: 1 })
  })

  it('ignores a second result for the same question', () => {
    const once = recordResult(startSession(config, makeQuestion('q1')), true, 54)
    const twice = recordResult(once, false, 48)
    expect(twice).toBe(once)
    expect(twice.session.attempted).toBe(1)
  })

  it('does not change the previous state object', () => {
    const start = startSession(config, makeQuestion('q1'))
    recordResult(start, true, 54)
    expect(start.attempts).toEqual([])
    expect(start.session.attempted).toBe(0)
  })

  it('ignores results after the session ended', () => {
    const ended = endSession(startSession(config, makeQuestion('q1')))
    expect(recordResult(ended, true, 54)).toBe(ended)
  })
})

describe('advance', () => {
  it('does nothing until the current question has a recorded result', () => {
    const start = startSession(config, makeQuestion('q1'))
    expect(advance(start, makeQuestion('q2'))).toBe(start)
  })

  it('moves to the next question and increments the index', () => {
    const recorded = recordResult(startSession(config, makeQuestion('q1')), true, 56)
    const next = advance(recorded, makeQuestion('q2'))
    expect(next.currentQuestion.id).toBe('q2')
    expect(next.currentQuestionIndex).toBe(1)
    expect(next.isActive).toBe(true)
    expect(hasRecordedCurrentQuestion(next)).toBe(false)
  })

  it('finishes the session after the last question of a fixed session', () => {
    let state = startSession(config, makeQuestion('q1'), now)
    state = advance(recordResult(state, true, 56), makeQuestion('q2'))
    expect(isLastQuestion(state)).toBe(true)
    state = advance(recordResult(state, false, 48), makeQuestion('q3'), now)
    expect(state.isActive).toBe(false)
    expect(state.session.completedAt).toBe('2026-10-20T12:00:00.000Z')
    expect(state.session.attempted).toBe(2)
    expect(state.currentQuestion.id).toBe('q2')
  })

  it('never finishes a continuous session by itself', () => {
    let state = startSession({ ...config, sessionLength: 'continuous' }, makeQuestion('q0'))
    for (let i = 1; i <= 30; i++) {
      state = advance(recordResult(state, true, 56), makeQuestion(`q${i}`))
      expect(isLastQuestion(state)).toBe(false)
    }
    expect(state.isActive).toBe(true)
    expect(state.session.attempted).toBe(30)
  })
})

describe('endSession', () => {
  it('marks the session finished and keeps the totals', () => {
    const recorded = recordResult(startSession(config, makeQuestion('q1')), true, 56)
    const ended = endSession(recorded, now)
    expect(ended.isActive).toBe(false)
    expect(ended.session.completedAt).toBe('2026-10-20T12:00:00.000Z')
    expect(ended.session.attempted).toBe(1)
  })
})
