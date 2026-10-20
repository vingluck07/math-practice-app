import type { AppSettings } from '../types/settings'

export const DEFAULT_SETTINGS: AppSettings = {
  soundEffectsEnabled: true,
  cardAnimationEnabled: true,
  showExplanations: true,
  defaultSessionLength: 10,
  defaultDifficulty: 1,
  defaultOperations: ['addition'],
  masteryThreshold: 3,
}
