import { vi } from 'vitest'

type Listener = () => void

/** Pretends the device does (or does not) ask for reduced motion, and lets a test flip it. */
export function mockReducedMotion(initial: boolean) {
  let matches = initial
  const listeners = new Set<Listener>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return matches
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }))
  return {
    set(value: boolean) {
      matches = value
      listeners.forEach((l) => l())
    },
  }
}
