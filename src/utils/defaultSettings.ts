import type { AppSettings } from '../types/settings'
import { DEFAULT_MASTERY_THRESHOLD } from './practiceConfig'

export const DEFAULT_SETTINGS: AppSettings = {
  soundEffectsEnabled: true,
  cardAnimationEnabled: true,
  showExplanations: true,
  feedbackEffectsEnabled: true,
  defaultSessionLength: 10,
  defaultDifficulty: 1,
  defaultOperations: ['addition'],
  masteryThreshold: DEFAULT_MASTERY_THRESHOLD,
}
