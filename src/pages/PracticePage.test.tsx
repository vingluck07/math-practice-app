import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppProvider from '../app/AppProvider'
import AppRoutes from '../app/AppRoutes'
import type { PracticeConfig } from '../types/session'

function renderPractice(config: PracticeConfig, path = '/practice/session') {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state: { config } }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('PracticePage', () => {
  it('walks through the questions in a session', async () => {
    const user = userEvent.setup()
    renderPractice({ operations: ['addition'], difficulty: 1, sessionLength: 5 })
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()

    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    await user.click(screen.getByRole('button', { name: 'Next Question' }))

    // A fresh card: question 2, nothing selected, flip disabled again.
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    for (const choice of screen.getAllByRole('button', { name: /^Answer \d: / })) {
      expect(choice).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('stops after the last question of a fixed-length session', async () => {
    const user = userEvent.setup()
    renderPractice({ operations: ['division'], difficulty: 2, sessionLength: 5 })
    for (let i = 0; i < 5; i++) {
      await user.keyboard('2')
      await user.click(screen.getByRole('button', { name: 'Flip Card' }))
      await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
      await user.click(screen.getByRole('button', { name: 'Next Question' }))
    }
    expect(screen.getByRole('heading', { name: /that's all the questions/i })).toBeInTheDocument()
  })

  it('keeps going in continuous practice', async () => {
    const user = userEvent.setup()
    renderPractice({ operations: ['subtraction'], difficulty: 1, sessionLength: 'continuous' })
    expect(screen.getByText('Question 1')).toBeInTheDocument()
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    await user.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(screen.getByText('Question 2')).toBeInTheDocument()
  })

  it('uses the static card when animation is turned off in settings', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AppProvider>
        <MemoryRouter initialEntries={['/settings']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProvider>,
    )
    await user.click(screen.getByRole('checkbox', { name: /card animation/i }))
    expect(screen.getByRole('checkbox', { name: /card animation/i })).not.toBeChecked()
    expect(container.querySelector('.flip')).toBeNull()
  })
})
