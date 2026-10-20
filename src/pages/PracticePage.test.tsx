import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppProvider from '../app/AppProvider'
import AppRoutes from '../app/AppRoutes'
import type { PracticeConfig } from '../types/session'

function renderPractice(config: PracticeConfig | undefined) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[{ pathname: '/practice/session', state: { config } }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

type User = ReturnType<typeof userEvent.setup>

/** Picks answer 1, flips, makes the confidence check, and presses the next button. */
async function answerQuestion(user: User, confident: boolean, nextLabel = 'Next Question') {
  await user.keyboard('1')
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(
    screen.getByRole('button', { name: confident ? 'I Got It Right' : 'I Got It Wrong' }),
  )
  await user.click(screen.getByRole('button', { name: nextLabel }))
}

describe('PracticePage', () => {
  it('sends you to setup when there is no valid session', () => {
    renderPractice(undefined)
    expect(screen.getByRole('heading', { name: 'Set Up Your Practice' })).toBeInTheDocument()
  })

  it('sends you to setup when the setup data is malformed', () => {
    renderPractice({ operations: [], difficulty: 1, sessionLength: 5 })
    expect(screen.getByRole('heading', { name: 'Set Up Your Practice' })).toBeInTheDocument()
  })

  it('shows the first question and an empty progress bar', () => {
    renderPractice({ operations: ['addition'], difficulty: 1, sessionLength: 5 })
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('resets the card for each new question and updates progress', async () => {
    const user = userEvent.setup()
    renderPractice({ operations: ['addition'], difficulty: 1, sessionLength: 5 })
    await answerQuestion(user, true)

    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    for (const choice of screen.getAllByRole('button', { name: /^Answer \d: / })) {
      expect(choice).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('offers "See Results" on the last question and then shows the summary', async () => {
    const user = userEvent.setup()
    renderPractice({ operations: ['division'], difficulty: 2, sessionLength: 5 })
    await answerQuestion(user, true)
    await answerQuestion(user, false)
    await answerQuestion(user, true)
    await answerQuestion(user, true)
    expect(screen.getByText('Question 5 of 5')).toBeInTheDocument()
    await answerQuestion(user, false, 'See Results')

    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(screen.getByText(/You practiced 5 questions/)).toBeInTheDocument()
    expect(screen.getByText(/3 you said right and 2 you said wrong/)).toBeInTheDocument()
  })

  it('does not count a question until the confidence check is made', async () => {
    const user = userEvent.setup()
    renderPractice({ operations: ['addition'], difficulty: 1, sessionLength: 5 })
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })
})

describe('PracticePage continuous practice', () => {
  const config: PracticeConfig = {
    operations: ['subtraction'],
    difficulty: 1,
    sessionLength: 'continuous',
  }

  it('has no progress bar or fixed total, and keeps going', async () => {
    const user = userEvent.setup()
    renderPractice(config)
    expect(screen.getByText('Question 1')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    for (let i = 0; i < 12; i++) await answerQuestion(user, true)
    expect(screen.getByText('Question 13')).toBeInTheDocument()
  })

  it('asks before ending, and can keep practicing', async () => {
    const user = userEvent.setup()
    renderPractice(config)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(screen.getByRole('dialog', { name: /end this session/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Question 1')).toBeInTheDocument()
  })

  it('ends the session and shows a summary of what was answered', async () => {
    const user = userEvent.setup()
    renderPractice(config)
    await answerQuestion(user, true)
    await answerQuestion(user, false)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))

    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(screen.getByText(/You practiced 2 questions/)).toBeInTheDocument()
    expect(screen.getByText(/1 you said right and 1 you said wrong/)).toBeInTheDocument()
  })
})
