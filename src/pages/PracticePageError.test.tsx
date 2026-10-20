import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AppRoutes from '../app/AppRoutes'

vi.mock('../services/questionGenerator', () => ({
  generateRandomQuestion: () => {
    throw new Error('generation failed')
  },
  generateNextQuestion: () => {
    throw new Error('generation failed')
  },
}))

describe('PracticePage when questions cannot be generated', () => {
  it('shows a friendly message instead of crashing', () => {
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
    expect(screen.getByRole('heading', { name: 'Oops!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Practice Setup' })).toBeInTheDocument()
  })
})
