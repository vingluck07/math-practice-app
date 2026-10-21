import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { loadAttempts } from '../services/practiceStorage'
import { renderAppAt, type User } from '../test/practiceHelpers'

/** Presses Tab until the control with this name has focus (fails if it is never reached). */
async function tabTo(user: User, name: RegExp) {
  for (let i = 0; i < 60; i++) {
    await user.tab()
    const active = document.activeElement as HTMLElement | null
    const labels = (active as HTMLInputElement | null)?.labels
    const label =
      active?.getAttribute('aria-label') ?? labels?.[0]?.textContent ?? active?.textContent ?? ''
    if (active && name.test(label)) return active
  }
  throw new Error(`Could not reach ${String(name)} with the Tab key`)
}

describe('completing a session with only the keyboard', () => {
  it('sets up, answers five questions and reaches the summary without a mouse', async () => {
    const user = userEvent.setup()
    renderAppAt('/practice/setup')

    // Arrow keys move through the length options; the group is reached with Tab.
    await tabTo(user, /10 questions/i)
    for (
      let i = 0;
      i < 4 && !(screen.getByRole('radio', { name: /5 questions/i }) as HTMLInputElement).checked;
      i++
    ) {
      await user.keyboard('{ArrowUp}')
    }
    expect(screen.getByRole('radio', { name: /5 questions/i })).toBeChecked()
    await tabTo(user, /^Start Session$/)
    await user.keyboard('{Enter}')

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Question ${i} of 5`)).toBeInTheDocument()
      await user.keyboard('2') // number keys pick an answer
      await tabTo(user, /^Flip Card$/)
      await user.keyboard('{Enter}')
      await tabTo(user, /I Got It Right/)
      await user.keyboard(' ')
      await tabTo(user, i === 5 ? /^See Results$/ : /^Next Question$/)
      await user.keyboard('{Enter}')
    }

    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(loadAttempts()).toHaveLength(5)
  })
})
