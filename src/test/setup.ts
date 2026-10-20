import '@testing-library/jest-dom/vitest'

// Each test starts with empty browser storage.
afterEach(() => {
  localStorage.clear()
})
