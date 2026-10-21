import { lazyPage } from './lazyPage'

export const StatisticsPage = lazyPage(() => import('../pages/StatisticsPage'))
export const SettingsPage = lazyPage(() => import('../pages/SettingsPage'))

/** Fetches the lazy pages ahead of time (for example once the first page has appeared). */
export function preloadPages(): Promise<unknown> {
  return Promise.all([StatisticsPage.preload(), SettingsPage.preload()])
}
