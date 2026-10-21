import type { MistakePattern } from '../types/mistake'
import type { Question } from '../types/question'
import type { PracticeConfig } from '../types/session'
import { ALL_OPERATIONS } from '../utils/practiceConfig'
import { selectMistakePattern, type SelectOptions } from './mistakePriority'
import { activePatterns } from './mistakeService'
import { generateSimilarQuestion } from './similarQuestions'

/**
 * The next question of a mistake-review session: a mistake is chosen by review priority
 * (a different one from the last question when possible) and a similar question is made
 * from it. Returns null when no mistakes are left to review.
 */
export function generateReviewQuestion(
  patterns: readonly MistakePattern[],
  previous?: Question,
  options: Omit<SelectOptions, 'avoidId'> = {},
): Question | null {
  const pattern = selectMistakePattern(patterns, {
    ...options,
    avoidId: previous?.mistakePatternId,
  })
  return pattern ? generateSimilarQuestion(pattern, { rng: options.rng, previous }) : null
}

/**
 * Fills in what a review session records about itself: the operations in the mistakes being
 * reviewed, and the level of the first question (questions can come from different levels).
 */
export function reviewSessionConfig(
  patterns: readonly MistakePattern[],
  config: PracticeConfig,
  firstQuestion: Question,
): PracticeConfig {
  const active = activePatterns(patterns)
  const operations = ALL_OPERATIONS.filter((o) => active.some((p) => p.operation === o))
  return {
    ...config,
    mode: 'mistake-review',
    operations: operations.length > 0 ? operations : config.operations,
    difficulty: firstQuestion.difficulty,
  }
}
