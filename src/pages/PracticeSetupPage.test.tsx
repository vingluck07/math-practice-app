import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppRoutes from '../app/AppRoutes'

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/practice/setup']}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('PracticeSetupPage', () => {
  it('starts with sensible defaults', () => {
    renderSetup()
    expect(screen.getByRole('checkbox', { name: /addition/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /subtraction/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /beginner/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /10 questions/i })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled()
  })

  it('allows several operations and a select-all shortcut', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: /division/i }))
    expect(screen.getByRole('checkbox', { name: /division/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /addition/i })).toBeChecked()

    await user.click(screen.getByRole('button', { name: /select all/i }))
    for (const name of [/addition/i, /subtraction/i, /multiplication/i, /division/i]) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked()
    }
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  it('lets only one difficulty and one length be selected', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('radio', { name: /advanced/i }))
    expect(screen.getByRole('radio', { name: /advanced/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /beginner/i })).not.toBeChecked()

    await user.click(screen.getByRole('radio', { name: /continuous/i }))
    expect(screen.getByRole('radio', { name: /continuous/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /10 questions/i })).not.toBeChecked()
  })

  it('disables Start Session and explains why when no operation is selected', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: /addition/i }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
    expect(screen.getByText(/pick at least one/i)).toBeInTheDocument()
  })

  it('passes the chosen settings to the practice page', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: /multiplication/i }))
    await user.click(screen.getByRole('radio', { name: /intermediate/i }))
    await user.click(screen.getByRole('radio', { name: /20 questions/i }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    expect(screen.getByText('Question 1 of 20')).toBeInTheDocument()
    // The question uses one of the chosen operations (addition or multiplication).
    expect(screen.getByRole('heading', { name: /plus|times/ })).toBeInTheDocument()
  })
})
