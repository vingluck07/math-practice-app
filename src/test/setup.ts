import '@testing-library/jest-dom/vitest'
import { beforeAll } from 'vitest'
import { preloadPages } from '../app/lazyPages'

// Load the lazy pages once, so tests can render them straight away.
beforeAll(async () => {
  await preloadPages()
})

// Each test starts with empty browser storage.
afterEach(() => {
  localStorage.clear()
})
