import type { DifficultyLevel, MathOperation } from './question'
import type { SessionLength } from './session'

export interface AppSettings {
  soundEffectsEnabled: boolean
  cardAnimationEnabled: boolean
  showExplanations: boolean
  /** Encouraging messages and the small celebration after each answer. */
  feedbackEffectsEnabled: boolean
  defaultSessionLength: SessionLength
  defaultDifficulty: DifficultyLevel
  defaultOperations: MathOperation[]
  /** Correct similar questions required before a mistake is considered mastered. */
  masteryThreshold: number
}
