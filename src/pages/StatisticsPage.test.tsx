import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppProvider from '../app/AppProvider'
import AppRoutes from '../app/AppRoutes'
import { STORAGE_KEYS, writeItem } from '../services/storageService'
import { makeAttempt, makePattern, makeSession } from '../test/factories'

function renderStatistics() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/statistics']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

/** The card for one operation or level, found by its heading. */
function card(name: string): HTMLElement {
  return screen.getByRole('heading', { name }).closest('article') as HTMLElement
}

const tile = (label: string) =>
  within(screen.getByLabelText('Overall statistics')).getByText(label, { selector: 'dt' })
    .parentElement as HTMLElement

function seedHistory() {
  const attempts = [
    makeAttempt({ operation: 'addition', difficulty: 1, correct: true }),
    makeAttempt({ operation: 'addition', difficulty: 1, correct: true }),
    makeAttempt({ operation: 'subtraction', difficulty: 2, correct: false }),
    makeAttempt({ operation: 'multiplication', difficulty: 3, correct: true }),
    makeAttempt({ operation: 'multiplication', difficulty: 3, correct: false, confident: true }),
    makeAttempt({ operation: 'multiplication', difficulty: 3, correct: false }),
  ]
  const sessions = [
    makeSession({
      id: 'older',
      startedAt: '2026-09-10T15:00:00.000Z',
      operations: ['addition', 'subtraction'],
      difficulty: 2,
      attempted: 3,
      correct: 2,
      incorrect: 1,
    }),
    makeSession({
      id: 'newer',
      startedAt: '2026-10-12T15:00:00.000Z',
      operations: ['multiplication'],
      difficulty: 3,
      attempted: 3,
      correct: 1,
      incorrect: 2,
    }),
  ]
  writeItem(STORAGE_KEYS.attempts, attempts)
  writeItem(STORAGE_KEYS.sessions, sessions)
}

describe('StatisticsPage for a new user', () => {
  it('shows a friendly empty state with a way to start', () => {
    renderStatistics()
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument()
    expect(screen.getByText('No practice yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    )
    expect(screen.queryByRole('button', { name: 'Reset Statistics' })).not.toBeInTheDocument()
  })
})

describe('StatisticsPage with practice history', () => {
  it('shows overall totals and accuracy', () => {
    seedHistory()
    renderStatistics()
    expect(tile('Questions')).toHaveTextContent('6')
    expect(tile('Correct')).toHaveTextContent('3')
    expect(tile('Incorrect')).toHaveTextContent('3')
    expect(tile('Accuracy')).toHaveTextContent('50%')
  })

  it('shows a card for each operation', () => {
    seedHistory()
    renderStatistics()
    const addition = within(card('Addition'))
    expect(addition.getByText('Attempted').nextSibling).toHaveTextContent('2')
    expect(addition.getByText('Correct').nextSibling).toHaveTextContent('2')
    expect(addition.getByText('Accuracy').nextSibling).toHaveTextContent('100%')

    const multiplication = within(card('Multiplication'))
    expect(multiplication.getByText('Attempted').nextSibling).toHaveTextContent('3')
    expect(multiplication.getByText('Incorrect').nextSibling).toHaveTextContent('2')
    expect(multiplication.getByText('Accuracy').nextSibling).toHaveTextContent('33%')

    expect(within(card('Subtraction')).getByText('Accuracy').nextSibling).toHaveTextContent('0%')
    // An operation never practiced shows a dash, not 0% or NaN.
    const division = within(card('Division'))
    expect(division.getByText('Attempted').nextSibling).toHaveTextContent('0')
    expect(division.getByText('Accuracy').nextSibling).toHaveTextContent('—')
  })

  it('shows a clearly labelled card for each level', () => {
    seedHistory()
    renderStatistics()
    for (const label of [
      'Level 1: Beginner',
      'Level 2: Easy',
      'Level 3: Intermediate',
      'Level 4: Advanced',
    ]) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument()
    }
    expect(
      within(card('Level 3: Intermediate')).getByText('Attempted').nextSibling,
    ).toHaveTextContent('3')
    expect(within(card('Level 1: Beginner')).getByText('Accuracy').nextSibling).toHaveTextContent(
      '100%',
    )
    expect(within(card('Level 4: Advanced')).getByText('Accuracy').nextSibling).toHaveTextContent(
      '—',
    )
  })

  it('lists recent sessions from newest to oldest with their details', () => {
    seedHistory()
    renderStatistics()
    const items = within(screen.getByRole('list', { name: 'Recent sessions' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(2)

    expect(items[0]).toHaveTextContent('Oct')
    expect(items[0]).toHaveTextContent('Multiplication')
    expect(items[0]).toHaveTextContent('Level 3 (Intermediate)')
    expect(items[0]).toHaveTextContent('3 questions · 1 correct · 2 incorrect')
    expect(items[0]).toHaveTextContent('33% accuracy')

    expect(items[1]).toHaveTextContent('Sep')
    expect(items[1]).toHaveTextContent('Addition, Subtraction')
    expect(items[1]).toHaveTextContent('Level 2 (Easy)')
    expect(items[1]).toHaveTextContent('67% accuracy')
  })

  it('shows an empty message for sessions if there are totals but no sessions', () => {
    writeItem(STORAGE_KEYS.attempts, [makeAttempt()])
    renderStatistics()
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
  })
})

describe('Reset Statistics', () => {
  it('asks first, and keeps everything if you change your mind', async () => {
    seedHistory()
    const user = userEvent.setup()
    renderStatistics()
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Are you sure you want to erase all practice history and statistics?',
    )
    await user.click(screen.getByRole('button', { name: 'Keep My History' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(tile('Questions')).toHaveTextContent('6')
    expect(localStorage.getItem(STORAGE_KEYS.attempts)).not.toBeNull()
  })

  it('erases history and statistics only after explicit confirmation, and keeps settings', async () => {
    seedHistory()
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ cardAnimationEnabled: false }))
    const user = userEvent.setup()
    renderStatistics()
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(screen.getByRole('button', { name: 'Yes, Erase Everything' }))

    // The page refreshes to the empty state.
    expect(screen.getByText('No practice yet')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    for (const key of ['attempts', 'sessions', 'statistics'] as const) {
      expect(localStorage.getItem(STORAGE_KEYS[key])).toBeNull()
    }
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toContain('cardAnimationEnabled')
  })
})

describe('StatisticsPage mistake review', () => {
  const dtValue = (region: HTMLElement, label: string) =>
    within(region).getByText(label, { selector: 'dt' }).parentElement as HTMLElement

  function seedMistakes() {
    seedHistory()
    writeItem(STORAGE_KEYS.mistakePatterns, [
      makePattern({
        id: 'multiplication:8:7',
        operation: 'multiplication',
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 56,
        incorrectCount: 4,
        similarCorrectCount: 1,
        lastIncorrectAt: '2026-10-10T12:00:00.000Z',
      }),
      makePattern({ id: 'addition:3:4', incorrectCount: 1, similarCorrectCount: 2 }),
      makePattern({
        id: 'subtraction:9:4',
        operation: 'subtraction',
        firstOperand: 9,
        secondOperand: 4,
        correctAnswer: 5,
        incorrectCount: 2,
        similarCorrectCount: 3,
        mastered: true,
      }),
    ])
    writeItem(STORAGE_KEYS.attempts, [
      makeAttempt({ source: 'mistake-review', correct: true }),
      makeAttempt({ source: 'mistake-review', correct: true }),
      makeAttempt({ source: 'mistake-review', correct: false }),
      makeAttempt({ source: 'regular', correct: true }),
    ])
  }

  it('shows counts for active and mastered mistakes and review questions', () => {
    seedMistakes()
    renderStatistics()
    const region = screen.getByLabelText('Mistake review statistics')
    expect(dtValue(region, 'Active mistakes')).toHaveTextContent('2')
    expect(dtValue(region, 'Mastered')).toHaveTextContent('1')
    expect(dtValue(region, 'Review questions')).toHaveTextContent('3')
    expect(dtValue(region, 'Review correct')).toHaveTextContent('2')
  })

  it('names the most missed operation and lists the most missed facts in order', () => {
    seedMistakes()
    renderStatistics()
    expect(screen.getByText(/most missed operation:/i).parentElement).toHaveTextContent(
      'Multiplication (4 misses)',
    )
    const facts = within(screen.getByRole('list', { name: 'Most missed facts' })).getAllByRole(
      'listitem',
    )
    expect(facts.map((f) => f.textContent)).toEqual([
      '8 × 7 = 56missed 4 times',
      '9 − 4 = 5missed 2 times',
      '3 + 4 = 7missed 1 time',
    ])
  })

  it('lists active mistakes with counts, progress and last missed date', () => {
    seedMistakes()
    renderStatistics()
    const list = screen.getByRole('list', { name: 'Active mistakes' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('8 × 7 = 56')
    expect(items[0]).toHaveTextContent('Missed 4 times')
    expect(items[0]).toHaveTextContent('1 of 3 similar questions correct')
    expect(items[0]).toHaveTextContent('2026')
    expect(within(items[0]).getByRole('progressbar')).toHaveAttribute('value', '1')
    expect(items[1]).toHaveTextContent('Missed 1 time')
    expect(items[1]).toHaveTextContent('2 of 3 similar questions correct')
  })

  it('shows mastered mistakes separately', async () => {
    seedMistakes()
    const user = userEvent.setup()
    renderStatistics()
    expect(screen.getByRole('button', { name: /^Active \(2\)/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: /^Mastered \(1\)/ }))

    expect(screen.queryByRole('list', { name: 'Active mistakes' })).not.toBeInTheDocument()
    const items = within(screen.getByRole('list', { name: 'Mastered mistakes' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('9 − 4 = 5')
    expect(items[0]).toHaveTextContent('Mastered')
  })

  it('uses the mastery threshold from settings', () => {
    seedMistakes()
    writeItem(STORAGE_KEYS.settings, { masteryThreshold: 5 })
    renderStatistics()
    expect(screen.getByText('1 of 5 similar questions correct')).toBeInTheDocument()
  })

  it('explains an empty mastered list and an empty active list', async () => {
    seedHistory()
    writeItem(STORAGE_KEYS.mistakePatterns, [makePattern()])
    const user = userEvent.setup()
    renderStatistics()
    await user.click(screen.getByRole('button', { name: /^Mastered/ }))
    expect(screen.getByText('Nothing mastered yet')).toBeInTheDocument()

    writeItem(STORAGE_KEYS.mistakePatterns, [makePattern({ mastered: true })])
    renderStatistics()
    expect(screen.getByText('No active mistakes')).toBeInTheDocument()
  })

  it('shows an empty state when there are no mistakes', () => {
    seedHistory()
    renderStatistics()
    expect(screen.getByText('No mistakes yet')).toBeInTheDocument()
    expect(screen.queryByText('Mistake Details')).not.toBeInTheDocument()
  })

  it('is erased by Reset Statistics', async () => {
    seedMistakes()
    const user = userEvent.setup()
    renderStatistics()
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(screen.getByRole('button', { name: 'Yes, Erase Everything' }))
    expect(screen.getByText('No practice yet')).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEYS.mistakePatterns)).toBeNull()
  })
})
