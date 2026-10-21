import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppProvider from '../app/AppProvider'
import AppRoutes from '../app/AppRoutes'
import { saveMistakePatterns } from '../services/practiceStorage'
import { makePattern } from '../test/factories'
import type { PracticeAttempt, PracticeSession } from '../types/session'

const session: PracticeSession = {
  id: 's1',
  startedAt: '2026-10-20T12:00:00.000Z',
  completedAt: '2026-10-20T12:05:00.000Z',
  operations: ['division', 'addition'],
  difficulty: 3,
  sessionLength: 10,
  attempted: 8,
  correct: 6,
  incorrect: 2,
}

function attempt(source: PracticeAttempt['source'], n: number): PracticeAttempt {
  return {
    id: `a${n}`,
    questionId: `q${n}`,
    operation: 'addition',
    firstOperand: 1,
    secondOperand: 2,
    correctAnswer: 3,
    selectedAnswer: 3,
    selfReportedCorrect: true,
    difficulty: 3,
    source,
    attemptedAt: '2026-10-20T12:01:00.000Z',
    sessionId: 's1',
  }
}

function renderSummary(state?: { session?: PracticeSession; attempts?: PracticeAttempt[] }) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[{ pathname: '/practice/summary', state }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

const statValue = (label: string) => screen.getByText(label).parentElement as HTMLElement

describe('SessionSummaryPage', () => {
  it('shows totals and accuracy', () => {
    renderSummary({ session, attempts: [] })
    expect(statValue('Questions')).toHaveTextContent('8')
    expect(statValue('Correct')).toHaveTextContent('6')
    expect(statValue('Incorrect')).toHaveTextContent('2')
    expect(statValue('Accuracy')).toHaveTextContent('75%')
    expect(screen.getByText('Nice work!')).toBeInTheDocument()
  })

  it('shows the operations practiced and the difficulty level', () => {
    renderSummary({ session, attempts: [] })
    expect(screen.getByText('Addition, Division')).toBeInTheDocument()
    expect(screen.getByText('3 (Intermediate)')).toBeInTheDocument()
  })

  it('counts mistake-review questions', () => {
    renderSummary({
      session,
      attempts: [attempt('regular', 1), attempt('mistake-review', 2), attempt('mistake-review', 3)],
    })
    expect(screen.getByText('Mistake review questions:').parentElement).toHaveTextContent('2')
  })

  it('handles a session with no answered questions', () => {
    renderSummary({ session: { ...session, attempted: 0, correct: 0, incorrect: 0 }, attempts: [] })
    expect(statValue('Accuracy')).toHaveTextContent('—')
    expect(screen.getByText('Ready when you are!')).toBeInTheDocument()
  })

  it('has every summary action', () => {
    renderSummary({ session, attempts: [] })
    expect(screen.getByRole('link', { name: 'Practice Again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Change Settings' })).toHaveAttribute(
      'href',
      '/practice/setup',
    )
    expect(screen.getByRole('link', { name: 'View Statistics' })).toHaveAttribute(
      'href',
      '/statistics',
    )
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/')
  })

  it('starts a new session with the same settings when you choose Practice Again', async () => {
    const user = userEvent.setup()
    renderSummary({ session: { ...session, sessionLength: 20 }, attempts: [] })
    await user.click(screen.getByRole('link', { name: 'Practice Again' }))
    expect(screen.getByText('Question 1 of 20')).toBeInTheDocument()
  })

  it('goes to the statistics and home pages', async () => {
    const user = userEvent.setup()
    renderSummary({ session, attempts: [] })
    await user.click(screen.getByRole('link', { name: 'View Statistics' }))
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument()
  })

  it('explains when there is no session to show', () => {
    renderSummary(undefined)
    expect(screen.getByText(/no session to show/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start Practice' })).toBeInTheDocument()
  })
})

describe('SessionSummaryPage practice mistakes', () => {
  it('is unavailable with a note when there is nothing to review', () => {
    renderSummary({ session, attempts: [] })
    expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toBeDisabled()
    expect(screen.getByText('No mistakes to review right now.')).toBeInTheDocument()
  })

  it('links to a review session when mistakes exist', () => {
    saveMistakePatterns([makePattern()])
    renderSummary({ session, attempts: [] })
    expect(screen.getByRole('link', { name: 'Practice Mistakes' })).toHaveAttribute(
      'href',
      '/practice/session',
    )
    expect(screen.queryByText('No mistakes to review right now.')).not.toBeInTheDocument()
  })

  it('describes a review session by its source of questions', () => {
    renderSummary({
      session: { ...session, mode: 'mistake-review' },
      attempts: [attempt('mistake-review', 1), attempt('mistake-review', 2)],
    })
    expect(screen.getByText('Based on your mistakes')).toBeInTheDocument()
    expect(screen.getByText('Mistake review questions:').parentElement).toHaveTextContent(
      'Mistake review questions: 2',
    )
  })
})
