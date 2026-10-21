import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import { shuffle } from '../utils/shuffle'
import { createId } from '../utils/ids'
import { formatQuestionText, pickRandom, type Rng } from '../utils/math'
import { isDifficultyLevel, isMathOperation, OPERATIONS } from '../utils/validation'

/** Hand-checked problems (one per operation and level) used only if generation keeps failing. */
const FALLBACKS: Record<MathOperation, Record<DifficultyLevel, [number, number, number]>> = {
  addition: { 1: [4, 3, 7], 2: [24, 13, 37], 3: [45, 38, 83], 4: [120, 135, 255] },
  subtraction: { 1: [9, 4, 5], 2: [40, 17, 23], 3: [82, 35, 47], 4: [340, 125, 215] },
  multiplication: { 1: [3, 4, 12], 2: [6, 7, 42], 3: [7, 8, 56], 4: [12, 7, 84] },
  division: { 1: [15, 3, 5], 2: [42, 6, 7], 3: [72, 8, 9], 4: [108, 9, 12] },
}

/**
 * A simple, always-valid question. Used as a last resort so practice never stops
 * because of a generation problem. Unknown inputs fall back to level 1 addition.
 */
export function createFallbackQuestion(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  rng?: Rng,
): Question {
  const known = operations.filter(isMathOperation)
  const operation = known.length > 0 ? pickRandom(known, rng) : OPERATIONS[0]
  const level = isDifficultyLevel(difficulty) ? difficulty : 1
  const [firstOperand, secondOperand, correctAnswer] = FALLBACKS[operation][level]
  return {
    id: createId(),
    operation,
    firstOperand,
    secondOperand,
    displayText: formatQuestionText(operation, firstOperand, secondOperand),
    correctAnswer,
    choices: shuffle(
      [correctAnswer, correctAnswer + 1, correctAnswer - 1, correctAnswer + 10],
      rng,
    ),
    difficulty: level,
    source: 'regular',
  }
}
