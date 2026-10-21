import { createContext, useContext } from 'react'
import type { AppSettings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../utils/defaultSettings'

export interface SettingsContextValue {
  settings: AppSettings
  updateSettings: (changes: Partial<AppSettings>) => void
  /** Erases everything this app saved and restores the defaults. Returns false if erasing failed. */
  clearAllData: () => boolean
}

/** Falls back to the defaults (and ignores updates) when no provider is mounted. */
export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  clearAllData: () => true,
})

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}
