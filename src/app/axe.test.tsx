import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { saveAttempt, saveMistakePatterns, saveSession } from '../services/practiceStorage'
import { makeAttempt, makePattern, makeSession } from '../test/factories'
import { renderAppAt } from '../test/practiceHelpers'
import type { PracticeConfig } from '../types/session'

/**
 * Runs the axe accessibility checker on the page that is currently shown.
 * Colour contrast is skipped because jsdom cannot compute it; the colour
 * tokens are checked separately in accessibility.test.tsx.
 */
async function violations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)
}

const config: PracticeConfig = { operations: ['addition'], difficulty: 1, sessionLength: 5 }

describe('automated accessibility check (axe)', () => {
  it.each(['/', '/practice/setup', '/settings', '/statistics', '/no-such-page'])(
    'finds no problems on %s',
    async (path) => {
      const { container } = renderAppAt(path)
      expect(await violations(container)).toEqual([])
    },
  )

  it('finds no problems on the statistics page with history', async () => {
    const session = makeSession()
    saveSession(session)
    saveAttempt(makeAttempt({ sessionId: session.id, correct: false }))
    saveMistakePatterns([makePattern()])
    const { container } = renderAppAt('/statistics')
    expect(await violations(container)).toEqual([])
  })

  it('finds no problems on a question, before and after flipping', async () => {
    const user = userEvent.setup()
    const { container } = renderAppAt('/practice/session', { config })
    expect(await violations(container)).toEqual([])

    await user.click(screen.getAllByRole('button', { name: /^Answer \d: / })[0])
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(await violations(container)).toEqual([])
  })

  it('finds no problems on the summary page', async () => {
    const { container } = renderAppAt('/practice/summary', {
      session: makeSession(),
      attempts: [],
    })
    expect(await violations(container)).toEqual([])
  })
})
