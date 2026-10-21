import type { DifficultyLevel, MathOperation, Question } from '../types/question'
import type { MistakePattern } from '../types/mistake'
import { buildChoices } from './distractors'
import { QuestionGenerationError } from './errors'
import { buildQuestion, type GeneratorOptions } from './generators/shared'
import { shuffle } from '../utils/shuffle'
import { getProblemErrors, getQuestionErrors } from '../utils/validation'

/** The three ways a related question can be made from a mistake. */
export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family'

/** Just the math of a question, before choices, IDs and labels are added. */
interface Problem {
  operation: MathOperation
  firstOperand: number
  secondOperand: number
  correctAnswer: number
}

/** The numbers a mistake pattern was made from. */
type Source = Pick<
  MistakePattern,
  'operation' | 'firstOperand' | 'secondOperand' | 'correctAnswer' | 'difficulty'
>

function problem(operation: MathOperation, a: number, b: number): Problem | null {
  switch (operation) {
    case 'addition':
      return { operation, firstOperand: a, secondOperand: b, correctAnswer: a + b }
    case 'subtraction':
      return a < b ? null : { operation, firstOperand: a, secondOperand: b, correctAnswer: a - b }
    case 'multiplication':
      return { operation, firstOperand: a, secondOperand: b, correctAnswer: a * b }
    case 'division':
      return b === 0 || a % b !== 0
        ? null
        : { operation, firstOperand: a, secondOperand: b, correctAnswer: a / b }
  }
}

/** Small changes to one number, or to both. */
const NEARBY_CHANGES: readonly (readonly [number, number])[] = [
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
  [0, 1],
  [0, -2],
  [0, 2],
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
]

/** The same operation with nearby numbers. */
function nearbyProblems(source: Source): Problem[] {
  const { operation, firstOperand: a, secondOperand: b, correctAnswer } = source
  const found: Problem[] = []
  for (const [da, db] of NEARBY_CHANGES) {
    // Division changes the divisor and the quotient, then rebuilds the dividend.
    const candidate =
      operation === 'division'
        ? problem(operation, (b + db) * (correctAnswer + da), b + db)
        : problem(operation, a + da, b + db)
    if (candidate) found.push(candidate)
  }
  return found
}

/** Addition and multiplication with the numbers swapped. Subtraction and division are not the same when reversed. */
function reversedProblems({ operation, firstOperand: a, secondOperand: b }: Source): Problem[] {
  if (operation !== 'addition' && operation !== 'multiplication') return []
  const candidate = problem(operation, b, a)
  return candidate ? [candidate] : []
}

/** The inverse operation using the same three numbers. */
function factFamilyProblems(source: Source): Problem[] {
  const { operation, firstOperand: a, secondOperand: b, correctAnswer: c } = source
  const candidates =
    operation === 'multiplication'
      ? [problem('division', c, b), problem('division', c, a)]
      : operation === 'division'
        ? [problem('multiplication', c, b), problem('multiplication', b, c)]
        : operation === 'addition'
          ? [problem('subtraction', c, a), problem('subtraction', c, b)]
          : [problem('addition', b, c), problem('addition', c, b)]
  return candidates.filter((p): p is Problem => p !== null)
}

const STRATEGIES: Record<SimilarityStrategy, (source: Source) => Problem[]> = {
  nearby: nearbyProblems,
  reversed: reversedProblems,
  'fact-family': factFamilyProblems,
}

const isSame = (a: Problem, b: Problem) =>
  a.operation === b.operation &&
  a.firstOperand === b.firstOperand &&
  a.secondOperand === b.secondOperand

function isValidAtLevel(candidate: Problem, difficulty: DifficultyLevel): boolean {
  const question = buildQuestion({ ...candidate, difficulty })
  return getProblemErrors(question).length === 0
}

/**
 * Every different, valid question one strategy can make from a mistake at the
 * mistake's own difficulty. The original question is never included, nor is
 * `avoid` (for example the question just shown).
 */
export function similarProblems(
  pattern: Source,
  strategy: SimilarityStrategy,
  avoid?: Pick<Question, 'operation' | 'firstOperand' | 'secondOperand'>,
): Problem[] {
  const excluded: Problem[] = [pattern, ...(avoid ? [{ ...avoid, correctAnswer: NaN }] : [])]
  const unique: Problem[] = []
  for (const candidate of STRATEGIES[strategy](pattern)) {
    if (excluded.some((e) => isSame(e, candidate))) continue
    if (unique.some((u) => isSame(u, candidate))) continue
    if (isValidAtLevel(candidate, pattern.difficulty)) unique.push(candidate)
  }
  return unique
}

export interface SimilarQuestionOptions extends Pick<GeneratorOptions, 'rng'> {
  /** The question shown most recently, so it is not repeated straight away. */
  previous?: Question
}

/**
 * Makes a related question from a mistake: a random strategy is tried first (nearby
 * numbers, reversed numbers, or the fact family), falling back to the others when it
 * has nothing valid. The question matches the mistake's difficulty, is labelled
 * `mistake-review` and carries the pattern's ID. If no different question exists at
 * all, the original question is asked again.
 */
export function generateSimilarQuestion(
  pattern: MistakePattern,
  { rng, previous }: SimilarQuestionOptions = {},
): Question {
  const order = shuffle<SimilarityStrategy>(['nearby', 'reversed', 'fact-family'], rng)
  const candidates = order.flatMap((strategy) =>
    shuffle(similarProblems(pattern, strategy, previous), rng),
  )
  candidates.push({
    operation: pattern.operation,
    firstOperand: pattern.firstOperand,
    secondOperand: pattern.secondOperand,
    correctAnswer: pattern.correctAnswer,
  })

  for (const candidate of candidates) {
    const base = buildQuestion({
      ...candidate,
      difficulty: pattern.difficulty,
      source: 'mistake-review',
    })
    const question: Question = {
      ...base,
      choices: buildChoices(base, { rng }),
      mistakePatternId: pattern.id,
    }
    if (getQuestionErrors(question).length === 0) return question
  }
  throw new QuestionGenerationError('Could not generate a similar question.')
}
