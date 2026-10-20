import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import {
  ADDITION_RULES,
  DIVISION_RULES,
  MULTIPLICATION_RULES,
  SUBTRACTION_RULES,
  inRange,
  type OperandRules,
} from './difficultyRules'

export const OPERATIONS: readonly MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [1, 2, 3, 4]

export function isMathOperation(value: unknown): value is MathOperation {
  return OPERATIONS.includes(value as MathOperation)
}

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return DIFFICULTY_LEVELS.includes(value as DifficultyLevel)
}

function fitsOperandRules(rules: OperandRules, first: number, second: number): boolean {
  return rules.variants.some((v) => inRange(first, v.first) && inRange(second, v.second))
}

/** Checks the math problem itself (operands, answer, difficulty rules), not the answer choices. */
export function getProblemErrors(question: Question): string[] {
  const errors: string[] = []
  const { operation, difficulty, firstOperand: a, secondOperand: b, correctAnswer } = question

  if (!isMathOperation(operation)) {
    return [`Unsupported operation: ${String(operation)}`]
  }
  if (!isDifficultyLevel(difficulty)) {
    return [`Unsupported difficulty: ${String(difficulty)}`]
  }
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    errors.push('Operands must be whole numbers.')
  }
  if (!Number.isFinite(correctAnswer) || !Number.isInteger(correctAnswer)) {
    errors.push('The correct answer must be a whole number.')
  }
  if (!question.displayText) {
    errors.push('The question needs display text.')
  }
  if (errors.length > 0) return errors

  switch (operation) {
    case 'addition': {
      const rules = ADDITION_RULES[difficulty]
      if (!fitsOperandRules(rules, a, b)) errors.push('Operands are outside the difficulty range.')
      if (correctAnswer !== a + b) errors.push('The answer does not match the operands.')
      if (rules.maxResult !== undefined && correctAnswer > rules.maxResult) {
        errors.push('The result is larger than this difficulty allows.')
      }
      break
    }
    case 'subtraction':
      if (!fitsOperandRules(SUBTRACTION_RULES[difficulty], a, b)) {
        errors.push('Operands are outside the difficulty range.')
      }
      if (a < b) errors.push('The first operand must not be smaller than the second.')
      if (correctAnswer !== a - b) errors.push('The answer does not match the operands.')
      break
    case 'multiplication':
      if (!fitsOperandRules(MULTIPLICATION_RULES[difficulty], a, b)) {
        errors.push('Factors are outside the difficulty range.')
      }
      if (correctAnswer !== a * b) errors.push('The answer does not match the factors.')
      break
    case 'division':
      if (b === 0) {
        errors.push('Division by zero is not allowed.')
      } else {
        if (a % b !== 0) errors.push('Division answers must be whole numbers.')
        if (correctAnswer !== a / b) errors.push('The answer does not match the operands.')
        const fits = DIVISION_RULES[difficulty].some(
          (r) => inRange(b, r.divisor) && inRange(correctAnswer, r.quotient),
        )
        if (!fits) errors.push('Divisor or quotient is outside the difficulty range.')
      }
      break
  }
  return errors
}

/** Checks the answer choices: exactly four, whole numbers, unique, and including the answer. */
export function getChoiceErrors(question: Question): string[] {
  const errors: string[] = []
  const { choices, correctAnswer } = question
  if (!Array.isArray(choices) || choices.length !== 4) {
    return ['There must be exactly four answer choices.']
  }
  if (!choices.every((c) => Number.isInteger(c)))
    errors.push('Answer choices must be whole numbers.')
  if (new Set(choices).size !== choices.length) errors.push('Answer choices must be unique.')
  if (choices.filter((c) => c === correctAnswer).length !== 1) {
    errors.push('The correct answer must appear exactly once among the choices.')
  }
  return errors
}

/** Returns every problem with a question (empty when it is valid). */
export function getQuestionErrors(question: Question): string[] {
  const problemErrors = getProblemErrors(question)
  return problemErrors.length > 0 ? problemErrors : getChoiceErrors(question)
}

export function isValidQuestion(question: Question): boolean {
  return getQuestionErrors(question).length === 0
}
