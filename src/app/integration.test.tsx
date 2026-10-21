import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  loadAttempts,
  loadMistakePatterns,
  loadSessions,
  loadStatistics,
} from '../services/practiceStorage'
import { answerQuestion, currentProblem, renderAppAt } from '../test/practiceHelpers'

const SYMBOL_TO_OPERATION = {
  '+': 'addition',
  '−': 'subtraction',
  '×': 'multiplication',
  '÷': 'division',
}

const tile = (label: string) =>
  within(screen.getByLabelText('Results')).getByText(label, { selector: 'dt' })
    .parentElement as HTMLElement

describe('a full session, started from the home page', () => {
  it('plays a five-question addition session and shows the right summary', async () => {
    const user = userEvent.setup()
    renderAppAt('/')
    await user.click(screen.getByRole('link', { name: /start practice/i }))
    await user.click(screen.getByRole('radio', { name: /5 questions/i }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Question ${i} of 5`)).toBeInTheDocument()
      expect(currentProblem().operation).toBe('+')
      await answerQuestion(user, i === 5 ? 'See Results' : 'Next Question', i !== 2)
    }

    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(tile('Questions')).toHaveTextContent('5')
    expect(tile('Correct')).toHaveTextContent('4')
    expect(tile('Incorrect')).toHaveTextContent('1')
    expect(tile('Accuracy')).toHaveTextContent('80%')
    expect(loadSessions()[0]).toMatchObject({ attempted: 5, correct: 4, incorrect: 1 })
    expect(loadStatistics()).toMatchObject({ attempted: 5, correct: 4, incorrect: 1 })
  })

  it('mixes the chosen operations in a mixed session', async () => {
    const user = userEvent.setup()
    renderAppAt('/practice/setup')
    await user.click(screen.getByRole('button', { name: /select all/i }))
    await user.click(screen.getByRole('radio', { name: /20 questions/i }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    const seen = new Set<string>()
    for (let i = 1; i <= 20; i++) {
      seen.add(SYMBOL_TO_OPERATION[currentProblem().operation as '+'])
      await answerQuestion(user, i === 20 ? 'See Results' : 'Next Question')
    }
    expect(seen.size).toBeGreaterThanOrEqual(2)
    const attempts = loadAttempts()
    expect(attempts).toHaveLength(20)
    expect(new Set(attempts.map((a) => a.operation))).toEqual(seen)
    expect(loadSessions()[0].operations).toHaveLength(4)
  })

  it('keeps going in continuous practice until the student ends it', async () => {
    const user = userEvent.setup()
    renderAppAt('/practice/setup')
    await user.click(screen.getByRole('radio', { name: /continuous/i }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    for (let i = 0; i < 12; i++) await answerQuestion(user, 'Next Question')
    expect(screen.getByText('Question 13')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))
    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(tile('Questions')).toHaveTextContent('12')
  })
})

describe('learning from a mistake', () => {
  it('turns a wrong answer into a pattern, reviews it, and masters it', async () => {
    const user = userEvent.setup()
    renderAppAt('/practice/setup')
    await user.click(screen.getByRole('radio', { name: /5 questions/i }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    await answerQuestion(user, 'Next Question', false)
    for (let i = 0; i < 3; i++) await answerQuestion(user, 'Next Question')
    await answerQuestion(user, 'See Results')

    const [pattern] = loadMistakePatterns()
    expect(loadMistakePatterns()).toHaveLength(1)
    expect(pattern).toMatchObject({ mastered: false, similarCorrectCount: 0 })

    await user.click(screen.getByRole('link', { name: 'Practice Mistakes' }))
    // Review questions are similar to the missed one, so they are generated until mastery.
    // The review ends by itself once nothing is left to review.
    for (let i = 0; i < 3; i++) await answerQuestion(user, 'Next Question')
    const [updated] = loadMistakePatterns().filter((p) => p.id === pattern.id)
    expect(updated.mastered).toBe(true)
    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(loadAttempts().filter((a) => a.source === 'mistake-review').length).toBeGreaterThan(0)
  })
})

describe('persistence and reset', () => {
  it('keeps statistics after the app is reopened, and Reset Statistics clears them', async () => {
    const user = userEvent.setup()
    const first = renderAppAt('/practice/setup')
    await user.click(screen.getByRole('radio', { name: /5 questions/i }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))
    for (let i = 0; i < 4; i++) await answerQuestion(user, 'Next Question')
    await answerQuestion(user, 'See Results')
    first.unmount()

    renderAppAt('/statistics')
    expect(
      within(screen.getByLabelText('Overall statistics')).getByText('Questions', { selector: 'dt' })
        .parentElement,
    ).toHaveTextContent('5')

    await user.click(screen.getByRole('button', { name: /reset statistics/i }))
    await user.click(screen.getByRole('button', { name: /yes, erase everything/i }))
    expect(loadAttempts()).toHaveLength(0)
    expect(loadSessions()).toHaveLength(0)
  })
})
