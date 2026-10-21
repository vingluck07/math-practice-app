/**
 * Development-only logging. Problems are written to the browser console while
 * developing (and are silent in production builds and tests), so students never
 * see technical details but developers still can.
 */
function shouldLog(): boolean {
  return import.meta.env.DEV && import.meta.env.MODE !== 'test'
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

export function logDevError(context: string, error?: unknown): void {
  if (!shouldLog()) return
  console.error(`[Math Practice] ${context}`, error === undefined ? '' : describe(error))
}

export function logDevWarning(context: string, details?: unknown): void {
  if (!shouldLog()) return
  console.warn(`[Math Practice] ${context}`, details === undefined ? '' : details)
}
