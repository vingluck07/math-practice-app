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

const statValue = (label: string) => screen.getByText(label).parentElement as HTMLElement

type User = ReturnType<typeof userEvent.setup>

/** Works out the correct answer from the problem text shown on the card. */
function solveCurrentQuestion(): number {
  const text = document.querySelector('.card__question span[aria-hidden]')?.textContent ?? ''
  const match = /(\d+) ([+−×÷]) (\d+)/.exec(text)
  if (!match) throw new Error(`Could not read question: ${text}`)
  const a = Number(match[1])
  const b = Number(match[3])
  return { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[match[2] as '+' | '−' | '×' | '÷']
}

/**
 * Answers one question: picks the right or a wrong answer, flips the card,
 * makes the confidence check, and presses the next button.
 */
async function answerQuestion(
  user: User,
  { correct = true, confident = true, nextLabel = 'Next Question' } = {},
) {
  const answer = solveCurrentQuestion()
  const choices = screen.getAllByRole('button', { name: /^Answer \d: / })
  const valueOf = (button: HTMLElement) => Number(button.getAttribute('aria-label')?.split(': ')[1])
  const pick = choices.find((c) => (valueOf(c) === answer) === correct)
  await user.click(pick as HTMLElement)
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
    await answerQuestion(user)

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
    await answerQuestion(user, { correct: true })
    await answerQuestion(user, { correct: false })
    await answerQuestion(user, { correct: true })
    await answerQuestion(user, { correct: true })
    expect(screen.getByText('Question 5 of 5')).toBeInTheDocument()
    await answerQuestion(user, { correct: false, nextLabel: 'See Results' })

    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(statValue('Questions')).toHaveTextContent('5')
    expect(statValue('Correct')).toHaveTextContent('3')
    expect(statValue('Incorrect')).toHaveTextContent('2')
    expect(statValue('Accuracy')).toHaveTextContent('60%')
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
    for (let i = 0; i < 12; i++) await answerQuestion(user)
    expect(screen.getByText('Question 13')).toBeInTheDocument()
  })

  it('counts correct and incorrect from the picked answers, not from the confidence check', async () => {
    const user = userEvent.setup()
    renderPractice(config)
    // Right answer but unsure; wrong answer but confident; right and confident.
    await answerQuestion(user, { correct: true, confident: false })
    await answerQuestion(user, { correct: false, confident: true })
    await answerQuestion(user, { correct: true, confident: true })
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))

    expect(statValue('Correct')).toHaveTextContent('2')
    expect(statValue('Incorrect')).toHaveTextContent('1')
    expect(statValue('Accuracy')).toHaveTextContent('67%')
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
    await answerQuestion(user, { correct: true })
    await answerQuestion(user, { correct: false })
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))

    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(statValue('Questions')).toHaveTextContent('2')
    expect(statValue('Correct')).toHaveTextContent('1')
    expect(statValue('Incorrect')).toHaveTextContent('1')
    expect(statValue('Accuracy')).toHaveTextContent('50%')
  })
})
