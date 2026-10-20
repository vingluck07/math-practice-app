import type { DifficultyLevel, MathOperation, Question, QuestionSource } from '../../types/question'
import { createId } from '../../utils/ids'
import { formatQuestionText, type Rng } from '../../utils/math'

export interface GeneratorOptions {
  rng?: Rng
  source?: QuestionSource
}

interface QuestionParts {
  operation: MathOperation
  difficulty: DifficultyLevel
  firstOperand: number
  secondOperand: number
  correctAnswer: number
  source?: QuestionSource
}

/**
 * Builds a Question from its parts. Answer choices are left empty here;
 * they are generated separately (Phase 5).
 */
export function buildQuestion(parts: QuestionParts): Question {
  return {
    id: createId(),
    operation: parts.operation,
    firstOperand: parts.firstOperand,
    secondOperand: parts.secondOperand,
    displayText: formatQuestionText(parts.operation, parts.firstOperand, parts.secondOperand),
    correctAnswer: parts.correctAnswer,
    choices: [],
    difficulty: parts.difficulty,
    source: parts.source ?? 'regular',
  }
}
