import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../app/AppRoutes'

const flags = vi.hoisted(() => ({ failChoices: false, failStart: false }))

vi.mock('../services/distractors', async (importActual) => {
  const actual = await importActual<typeof import('../services/distractors')>()
  return {
    ...actual,
    buildChoices: (...args: Parameters<typeof actual.buildChoices>) => {
      if (flags.failChoices) throw new Error('generation failed')
      return actual.buildChoices(...args)
    },
  }
})

vi.mock('../services/practiceSession', async (importActual) => {
  const actual = await importActual<typeof import('../services/practiceSession')>()
  return {
    ...actual,
    startSession: (...args: Parameters<typeof actual.startSession>) => {
      if (flags.failStart) throw new Error('start failed')
      return actual.startSession(...args)
    },
  }
})

function renderPractice() {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/practice/session',
          state: { config: { operations: ['addition'], difficulty: 1, sessionLength: 5 } },
        },
      ]}
    >
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('PracticePage when things go wrong', () => {
  beforeEach(() => {
    flags.failChoices = false
    flags.failStart = false
  })

  it('keeps practice going with a built-in question when generation fails', () => {
    flags.failChoices = true
    renderPractice()
    expect(screen.getAllByText('4 + 3 = ?')[0]).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Oops!' })).not.toBeInTheDocument()
  })

  it('shows a friendly message with a way home instead of crashing', () => {
    flags.failStart = true
    renderPractice()
    expect(screen.getByRole('heading', { name: 'Oops!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Practice Setup' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toBeInTheDocument()
  })
})
