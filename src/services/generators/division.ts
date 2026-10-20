import type { DifficultyLevel, Question } from '../../types/question'
import { DIVISION_RULES } from '../../utils/difficultyRules'
import { pickRandom, randomInt } from '../../utils/math'
import { buildQuestion, type GeneratorOptions } from './shared'

/**
 * Picks a nonzero divisor and a whole-number quotient first, then computes the
 * dividend, so the answer is always whole and division by zero cannot happen.
 */
export function generateDivision(
  difficulty: DifficultyLevel,
  { rng = Math.random, source }: GeneratorOptions = {},
): Question {
  const rule = pickRandom(DIVISION_RULES[difficulty], rng)
  const divisor = randomInt(rule.divisor[0], rule.divisor[1], rng)
  const quotient = randomInt(rule.quotient[0], rule.quotient[1], rng)
  return buildQuestion({
    operation: 'division',
    difficulty,
    firstOperand: divisor * quotient,
    secondOperand: divisor,
    correctAnswer: quotient,
    source,
  })
}
