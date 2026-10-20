import { vi } from 'vitest'

/** Makes the browser's storage unusable, as in some private-browsing modes. */
export function blockStorage() {
  return vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('Storage is blocked', 'SecurityError')
  })
}

/** Makes every write fail as if the browser's storage were full. */
export function fillStorage() {
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('The quota has been exceeded', 'QuotaExceededError')
  })
}
