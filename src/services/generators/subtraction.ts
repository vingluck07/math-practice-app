import type { DifficultyLevel, Question } from '../../types/question'
import { SUBTRACTION_RULES } from '../../utils/difficultyRules'
import { pickRandom, randomInt } from '../../utils/math'
import { buildQuestion, type GeneratorOptions } from './shared'

export function generateSubtraction(
  difficulty: DifficultyLevel,
  { rng = Math.random, source }: GeneratorOptions = {},
): Question {
  const variant = pickRandom(SUBTRACTION_RULES[difficulty].variants, rng)
  const a = randomInt(variant.first[0], variant.first[1], rng)
  const b = randomInt(variant.second[0], variant.second[1], rng)
  // Larger number first so the answer is never negative.
  const firstOperand = Math.max(a, b)
  const secondOperand = Math.min(a, b)
  return buildQuestion({
    operation: 'subtraction',
    difficulty,
    firstOperand,
    secondOperand,
    correctAnswer: firstOperand - secondOperand,
    source,
  })
}
