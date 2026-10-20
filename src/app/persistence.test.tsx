import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadAttempts, loadSessions } from '../services/practiceStorage'
import { STORAGE_KEYS } from '../services/storageService'
import { blockStorage, fillStorage } from '../test/storageHelpers'
import type { PracticeConfig } from '../types/session'
import AppProvider from './AppProvider'
import AppRoutes from './AppRoutes'

afterEach(() => vi.restoreAllMocks())

function renderApp(path: string, config?: PracticeConfig) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state: config ? { config } : undefined }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

const animationSwitch = () => screen.getByRole('checkbox', { name: /card animation/i })

describe('settings persistence', () => {
  it('remembers a changed setting after the app is closed and reopened', async () => {
    const user = userEvent.setup()
    const first = renderApp('/settings')
    expect(animationSwitch()).toBeChecked()
    await user.click(animationSwitch())
    expect(animationSwitch()).not.toBeChecked()
    first.unmount()

    renderApp('/settings') // a fresh start reads from browser storage
    expect(animationSwitch()).not.toBeChecked()
  })

  it('recovers from damaged saved settings', () => {
    localStorage.setItem(STORAGE_KEYS.settings, '{{{ broken')
    renderApp('/settings')
    expect(animationSwitch()).toBeChecked()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('stamps the data version on first start', () => {
    renderApp('/')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.version) ?? 'null')).toEqual({ version: 1 })
  })
})

type User = ReturnType<typeof userEvent.setup>

async function answerOne(user: User, nextLabel: string, pickCorrect = true) {
  const text = document.querySelector('.card__question span[aria-hidden]')?.textContent ?? ''
  const [, a, op, b] = /(\d+) ([+−×÷]) (\d+)/.exec(text) ?? []
  const answer = { '+': +a + +b, '−': +a - +b, '×': +a * +b, '÷': +a / +b }[op as '+']
  const choices = screen.getAllByRole('button', { name: /^Answer \d: / })
  const value = (el: HTMLElement) => Number(el.getAttribute('aria-label')?.split(': ')[1])
  await user.click(choices.find((c) => (value(c) === answer) === pickCorrect) as HTMLElement)
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
  await user.click(screen.getByRole('button', { name: nextLabel }))
}

describe('saving practice results', () => {
  const config: PracticeConfig = { operations: ['addition'], difficulty: 1, sessionLength: 5 }

  it('saves every attempt and the finished session', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', config)
    for (let i = 0; i < 4; i++) await answerOne(user, 'Next Question', i !== 1)
    await answerOne(user, 'See Results')

    const attempts = loadAttempts()
    expect(attempts).toHaveLength(5)
    expect(attempts.every((a) => a.operation === 'addition' && a.difficulty === 1)).toBe(true)
    expect(attempts.filter((a) => a.selectedAnswer === a.correctAnswer)).toHaveLength(4)
    expect(attempts.every((a) => a.selfReportedCorrect)).toBe(true)
    expect(new Set(attempts.map((a) => a.sessionId)).size).toBe(1)

    const [session] = loadSessions()
    expect(session.id).toBe(attempts[0].sessionId)
    expect(session).toMatchObject({ attempted: 5, correct: 4, incorrect: 1 })
    expect(session.completedAt).toBeTruthy()
  })

  it('saves progress as it happens, even if the student leaves mid-session', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', config)
    await answerOne(user, 'Next Question')
    await answerOne(user, 'Next Question')

    expect(loadAttempts()).toHaveLength(2)
    const [session] = loadSessions()
    expect(session).toMatchObject({ attempted: 2 })
    expect(session.completedAt).toBeUndefined()
  })

  it('keeps previous sessions when a new one is played', async () => {
    const user = userEvent.setup()
    const first = renderApp('/practice/session', config)
    await answerOne(user, 'Next Question')
    first.unmount()

    renderApp('/practice/session', config)
    await answerOne(user, 'Next Question')
    expect(loadAttempts()).toHaveLength(2)
    expect(loadSessions()).toHaveLength(2)
  })
})

describe('statistics after practicing', () => {
  it('appear on the statistics page once questions have been answered', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { operations: ['division'], difficulty: 2, sessionLength: 5 })
    await answerOne(user, 'Next Question', true)
    await answerOne(user, 'Next Question', true)
    await answerOne(user, 'Next Question', false)
    await user.click(screen.getByRole('link', { name: 'Statistics' }))

    const tile = (label: string) =>
      within(screen.getByLabelText('Overall statistics')).getByText(label, { selector: 'dt' })
        .parentElement as HTMLElement
    expect(tile('Questions')).toHaveTextContent('3')
    expect(tile('Correct')).toHaveTextContent('2')
    expect(tile('Incorrect')).toHaveTextContent('1')
    expect(tile('Accuracy')).toHaveTextContent('67%')
    expect(screen.getByRole('list', { name: 'Recent sessions' })).toHaveTextContent('Division')
  })
})

describe('when saving is not possible', () => {
  const config: PracticeConfig = { operations: ['addition'], difficulty: 1, sessionLength: 5 }

  it('shows a friendly warning at start-up if storage is blocked, and practice still works', async () => {
    blockStorage()
    const user = userEvent.setup()
    renderApp('/practice/session', config)
    expect(screen.getByRole('status')).toHaveTextContent(/can't save your progress/i)

    await answerOne(user, 'Next Question')
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the warning if storage fills up mid-session, and practice continues', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', config)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fillStorage()
    await answerOne(user, 'Next Question')
    expect(screen.getByRole('status')).toHaveTextContent(/can't save your progress/i)
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
  })

  it('still applies a settings change when it cannot be saved', async () => {
    blockStorage()
    const user = userEvent.setup()
    renderApp('/settings')
    await user.click(animationSwitch())
    expect(animationSwitch()).not.toBeChecked()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
