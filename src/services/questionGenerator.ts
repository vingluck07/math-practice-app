import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import { pickRandom } from '../utils/math'
import { getQuestionErrors, isDifficultyLevel, isMathOperation } from '../utils/validation'
import { buildChoices } from './distractors'
import { QuestionGenerationError } from './errors'
import { generateAddition } from './generators/addition'
import { generateDivision } from './generators/division'
import { generateMultiplication } from './generators/multiplication'
import { generateSubtraction } from './generators/subtraction'
import type { GeneratorOptions } from './generators/shared'

export type { GeneratorOptions }

/** How many times to retry if a generated question fails validation. */
const MAX_ATTEMPTS = 5

export { QuestionGenerationError }

const GENERATORS: Record<
  MathOperation,
  (difficulty: DifficultyLevel, options?: GeneratorOptions) => Question
> = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
}

/** Generates one validated question, with four shuffled answer choices, for the given operation and difficulty. */
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
    const problem = GENERATORS[operation](difficulty, options)
    const question = { ...problem, choices: buildChoices(problem, { rng: options.rng }) }
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

/** How many times to re-roll to avoid showing the same problem twice in a row. */
const MAX_REPEAT_RETRIES = 10

function isSameProblem(a: Question, b: Question): boolean {
  return (
    a.operation === b.operation &&
    a.firstOperand === b.firstOperand &&
    a.secondOperand === b.secondOperand
  )
}

/** Like `generateRandomQuestion`, but avoids repeating the previous problem. */
export function generateNextQuestion(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  previous?: Question,
  options: GeneratorOptions = {},
): Question {
  let question = generateRandomQuestion(operations, difficulty, options)
  for (let i = 0; i < MAX_REPEAT_RETRIES && previous && isSameProblem(question, previous); i++) {
    question = generateRandomQuestion(operations, difficulty, options)
  }
  return question
}
