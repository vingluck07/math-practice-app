import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppRoutes from './AppRoutes'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  it('renders the home page with the app title and welcome message', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: /math practice app/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /welcome to math practice/i })).toBeInTheDocument()
  })

  it('navigates from the home buttons to their pages', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('link', { name: 'Start Practice' }))
    expect(screen.getByRole('heading', { name: 'Set Up Your Practice' })).toBeInTheDocument()
  })

  it.each([
    ['/practice/setup', 'Set Up Your Practice'],
    ['/practice/summary', 'Session Summary'],
    ['/statistics', 'Statistics'],
    ['/settings', 'Settings'],
  ])('renders %s', (path, heading) => {
    renderAt(path)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('sends /practice/session without setup data back to the setup page', () => {
    renderAt('/practice/session')
    expect(screen.getByRole('heading', { name: 'Set Up Your Practice' })).toBeInTheDocument()
    expect(screen.getByText(/choose your settings to start a new one/i)).toBeInTheDocument()
  })

  it('shows a fallback page for unknown routes', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })
})
