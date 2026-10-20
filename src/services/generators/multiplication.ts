import type { DifficultyLevel, Question } from '../../types/question'
import { MULTIPLICATION_RULES } from '../../utils/difficultyRules'
import { pickRandom, randomInt } from '../../utils/math'
import { buildQuestion, type GeneratorOptions } from './shared'

export function generateMultiplication(
  difficulty: DifficultyLevel,
  { rng = Math.random, source }: GeneratorOptions = {},
): Question {
  const variant = pickRandom(MULTIPLICATION_RULES[difficulty].variants, rng)
  const firstOperand = randomInt(variant.first[0], variant.first[1], rng)
  const secondOperand = randomInt(variant.second[0], variant.second[1], rng)
  return buildQuestion({
    operation: 'multiplication',
    difficulty,
    firstOperand,
    secondOperand,
    correctAnswer: firstOperand * secondOperand,
    source,
  })
}
