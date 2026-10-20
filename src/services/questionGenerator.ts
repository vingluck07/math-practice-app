import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import { pickRandom } from '../utils/math'
import { getQuestionErrors, isDifficultyLevel, isMathOperation } from '../utils/validation'
import { generateAddition } from './generators/addition'
import { generateDivision } from './generators/division'
import { generateMultiplication } from './generators/multiplication'
import { generateSubtraction } from './generators/subtraction'
import type { GeneratorOptions } from './generators/shared'

export type { GeneratorOptions }

/** How many times to retry if a generated question fails validation. */
const MAX_ATTEMPTS = 5

export class QuestionGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuestionGenerationError'
  }
}

const GENERATORS: Record<
  MathOperation,
  (difficulty: DifficultyLevel, options?: GeneratorOptions) => Question
> = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
}

/** Generates one validated question for the given operation and difficulty. */
export function generateQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  options: GeneratorOptions = {},
): Question {
  if (!isMathOperation(operation)) {
    throw new QuestionGenerationError(`Unsupported operation: ${String(operation)}`)
  }
  if (!isDifficultyLevel(difficulty)) {
    throw new QuestionGenerationError(`Unsupported difficulty: ${String(difficulty)}`)
  }

  let errors: string[] = []
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const question = GENERATORS[operation](difficulty, options)
    errors = getQuestionErrors(question)
    if (errors.length === 0) return question
  }
  throw new QuestionGenerationError(
    `Could not generate a valid ${operation} question: ${errors.join(' ')}`,
  )
}

/** Generates a question using a randomly chosen operation from the enabled ones. */
export function generateRandomQuestion(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  options: GeneratorOptions = {},
): Question {
  if (operations.length === 0) {
    throw new QuestionGenerationError('At least one operation is required.')
  }
  return generateQuestion(pickRandom(operations, options.rng), difficulty, options)
}
