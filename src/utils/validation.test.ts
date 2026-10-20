import { describe, expect, it } from 'vitest'
import type { Question } from '../types/question'
import { getQuestionErrors, isValidQuestion } from './validation'

const base: Question = {
  id: 'q1',
  operation: 'addition',
  firstOperand: 3,
  secondOperand: 4,
  displayText: '3 + 4 = ?',
  correctAnswer: 7,
  choices: [7, 8, 6, 9],
  difficulty: 1,
  source: 'regular',
}

describe('getQuestionErrors', () => {
  it('accepts a valid question', () => {
    expect(isValidQuestion(base)).toBe(true)
  })

  it('rejects unsupported operations and difficulties', () => {
    expect(getQuestionErrors({ ...base, operation: 'power' as never })).not.toEqual([])
    expect(getQuestionErrors({ ...base, difficulty: 7 as never })).not.toEqual([])
  })

  it('rejects a wrong answer', () => {
    expect(isValidQuestion({ ...base, correctAnswer: 8 })).toBe(false)
  })

  it('rejects operands outside the difficulty range', () => {
    expect(isValidQuestion({ ...base, firstOperand: 40, correctAnswer: 44 })).toBe(false)
  })

  it('rejects negative subtraction results', () => {
    const q: Question = {
      ...base,
      operation: 'subtraction',
      firstOperand: 3,
      secondOperand: 5,
      correctAnswer: -2,
    }
    expect(isValidQuestion(q)).toBe(false)
  })

  it('rejects division by zero', () => {
    const q: Question = {
      ...base,
      operation: 'division',
      firstOperand: 5,
      secondOperand: 0,
      correctAnswer: Infinity,
    }
    expect(isValidQuestion(q)).toBe(false)
  })

  it('rejects division with a remainder', () => {
    const q: Question = {
      ...base,
      operation: 'division',
      firstOperand: 7,
      secondOperand: 2,
      correctAnswer: 3.5,
    }
    expect(isValidQuestion(q)).toBe(false)
  })

  it('rejects a question that does not match its difficulty', () => {
    const q: Question = {
      ...base,
      operation: 'multiplication',
      firstOperand: 9,
      secondOperand: 9,
      correctAnswer: 81,
      choices: [81, 80, 72, 90],
      difficulty: 1,
    }
    expect(isValidQuestion(q)).toBe(false)
    expect(isValidQuestion({ ...q, difficulty: 3 })).toBe(true)
  })
})

describe('answer choice validation', () => {
  it('requires exactly four choices', () => {
    expect(isValidQuestion({ ...base, choices: [7, 8, 6] })).toBe(false)
    expect(isValidQuestion({ ...base, choices: [7, 8, 6, 9, 5] })).toBe(false)
  })

  it('requires unique choices', () => {
    expect(isValidQuestion({ ...base, choices: [7, 8, 8, 9] })).toBe(false)
  })

  it('requires the correct answer to be one of the choices', () => {
    expect(isValidQuestion({ ...base, choices: [5, 8, 6, 9] })).toBe(false)
  })

  it('requires whole-number choices', () => {
    expect(isValidQuestion({ ...base, choices: [7, 8.5, 6, 9] })).toBe(false)
  })
})
