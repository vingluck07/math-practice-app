import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppProvider from '../app/AppProvider'
import AppRoutes from '../app/AppRoutes'
import { loadSettings } from '../services/settingsStorage'
import { STORAGE_KEYS } from '../services/storageService'
import { makeAttempt } from '../test/factories'
import { saveAttempt } from '../services/practiceStorage'
import { DEFAULT_SETTINGS } from '../utils/defaultSettings'

function renderApp(path: string) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

const box = (name: RegExp) => screen.getByRole('checkbox', { name })

describe('SettingsPage', () => {
  it('shows every setting with its current value', () => {
    renderApp('/settings')
    expect(box(/sound effects/i)).toBeChecked()
    expect(box(/card animation/i)).toBeChecked()
    expect(box(/show explanations/i)).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /addition/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /beginner/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /10 questions/i })).toBeChecked()
    expect(screen.getByText(/clearing your browser data may erase/i)).toBeInTheDocument()
  })

  it('saves each change automatically', async () => {
    const user = userEvent.setup()
    renderApp('/settings')
    await user.click(box(/sound effects/i))
    await user.click(box(/show explanations/i))
    await user.click(screen.getByRole('checkbox', { name: /multiplication/i }))
    await user.click(screen.getByRole('radio', { name: /advanced/i }))
    await user.click(screen.getByRole('radio', { name: /20 questions/i }))

    expect(loadSettings()).toMatchObject({
      soundEffectsEnabled: false,
      showExplanations: false,
      defaultOperations: ['addition', 'multiplication'],
      defaultDifficulty: 4,
      defaultSessionLength: 20,
    })
  })

  it('keeps at least one default operation', async () => {
    const user = userEvent.setup()
    renderApp('/settings')
    await user.click(screen.getByRole('checkbox', { name: /addition/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Keep at least one operation')
    expect(screen.getByRole('checkbox', { name: /addition/i })).toBeChecked()
    expect(loadSettings().defaultOperations).toEqual(['addition'])
  })

  it('starts the setup page from the saved defaults, which can still be changed per session', async () => {
    const user = userEvent.setup()
    renderApp('/settings')
    await user.click(screen.getByRole('checkbox', { name: /division/i }))
    await user.click(screen.getByRole('radio', { name: /intermediate/i }))
    await user.click(screen.getByRole('radio', { name: /5 questions/i }))
    await user.click(screen.getByRole('link', { name: 'Practice' }))

    expect(screen.getByRole('checkbox', { name: /division/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /intermediate/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /5 questions/i })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: /beginner/i }))
    expect(loadSettings().defaultDifficulty).toBe(3)
  })

  describe('clear all application data', () => {
    async function openConfirm(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }))
      return screen.getByRole('dialog')
    }

    it('warns first and changes nothing when cancelled', async () => {
      const user = userEvent.setup()
      saveAttempt(makeAttempt())
      renderApp('/settings')
      await user.click(box(/sound effects/i))
      const dialog = await openConfirm(user)
      expect(dialog).toHaveTextContent('cannot be undone')
      await user.click(within(dialog).getByRole('button', { name: 'Keep My Data' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(box(/sound effects/i)).not.toBeChecked()
      expect(localStorage.getItem(STORAGE_KEYS.attempts)).not.toBeNull()
    })

    it('erases everything, restores defaults and returns home', async () => {
      const user = userEvent.setup()
      saveAttempt(makeAttempt())
      localStorage.setItem('otherApp.key', 'keep')
      renderApp('/settings')
      await user.click(box(/sound effects/i))
      const dialog = await openConfirm(user)
      await user.click(within(dialog).getByRole('button', { name: 'Yes, Erase Everything' }))

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/math/i)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(localStorage.getItem(STORAGE_KEYS.attempts)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.statistics)).toBeNull()
      expect(localStorage.getItem('otherApp.key')).toBe('keep')
      expect(loadSettings()).toEqual(DEFAULT_SETTINGS)

      await user.click(
        within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', {
          name: 'Settings',
        }),
      )
      expect(box(/sound effects/i)).toBeChecked()
    })
  })
})
