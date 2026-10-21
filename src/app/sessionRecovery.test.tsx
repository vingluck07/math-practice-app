import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { loadActiveSession } from '../services/activeSessionStorage'
import { loadAttempts, loadSessions } from '../services/practiceStorage'
import { STORAGE_KEYS } from '../services/storageService'
import type { PracticeConfig } from '../types/session'
import AppProvider from './AppProvider'
import AppRoutes from './AppRoutes'

const config: PracticeConfig = { operations: ['addition'], difficulty: 1, sessionLength: 3 }

type User = ReturnType<typeof userEvent.setup>

function renderApp(path: string, state?: unknown) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

/** Like the real app: a data router, which is what makes leaving a session ask first. */
function renderDataRouter(path: string, state?: unknown) {
  const router = createMemoryRouter([{ path: '*', element: <AppRoutes /> }], {
    initialEntries: [{ pathname: path, state }],
  })
  render(
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>,
  )
  return router
}

const questionText = () => document.querySelector('.card__question span[aria-hidden]')?.textContent
const choice = (n: number) => document.querySelectorAll<HTMLElement>('.answer')[n - 1]

function correctValue(): number {
  const [, a, op, b] = /(\d+) ([+−×÷]) (\d+)/.exec(questionText() ?? '') ?? []
  return { '+': +a + +b, '−': +a - +b, '×': +a * +b, '÷': +a / +b }[op as '+']
}

/** Picks an answer, flips the card and makes the confidence check; optionally moves on. */
async function answer(
  user: User,
  { next = true, nextLabel = 'Next Question', correct = true } = {},
) {
  const value = (el: HTMLElement) => Number(el.getAttribute('aria-label')?.split(': ')[1])
  const pick = [...document.querySelectorAll<HTMLElement>('.answer')].find(
    (c) => (value(c) === correctValue()) === correct,
  ) as HTMLElement
  await user.click(pick)
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
  if (next) await user.click(screen.getByRole('button', { name: nextLabel }))
}

/** What the browser keeps across a refresh: the page address and its saved state. */
function refreshState() {
  const saved = loadActiveSession()
  return { config, runId: saved?.state.session.id }
}

describe('saving a running session', () => {
  it('saves a new session as soon as it starts', () => {
    renderApp('/practice/session', { config })
    const saved = loadActiveSession()
    expect(saved?.state.currentQuestion.displayText).toBe(
      document.querySelector('.card__question span[aria-hidden]')?.textContent,
    )
    expect(saved?.state.session.attempted).toBe(0)
    expect(saved?.config).toEqual(config)
  })

  it('keeps the save up to date after every answer', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await answer(user)
    const saved = loadActiveSession()
    expect(saved?.state.session.attempted).toBe(1)
    expect(saved?.state.currentQuestionIndex).toBe(1)
    expect(saved?.state.currentQuestion.displayText).toBe(questionText())
  })

  it('remembers the answer that was picked', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await user.click(choice(2))
    expect(loadActiveSession()?.selectedAnswer).toBe(
      Number(choice(2).getAttribute('aria-label')?.split(': ')[1]),
    )
    await user.keyboard('3')
    expect(loadActiveSession()?.selectedAnswer).toBe(
      Number(choice(3).getAttribute('aria-label')?.split(': ')[1]),
    )
  })

  it('clears the save when the session finishes', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config: { ...config, sessionLength: 1 } })
    await answer(user, { nextLabel: 'See Results' })
    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.activeSession)).toBeNull()
  })

  it('clears the save when a continuous session is ended', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config: { ...config, sessionLength: 'continuous' } })
    await answer(user)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))
    expect(loadActiveSession()).toBeNull()
  })
})

describe('restoring after a refresh', () => {
  it('shows the same question with the same progress', async () => {
    const user = userEvent.setup()
    const first = renderApp('/practice/session', { config })
    await answer(user)
    await answer(user)
    const question = questionText()
    // The page remembers which session it showed (done by the app itself); see below.
    first.unmount()

    renderApp('/practice/session', refreshState())
    expect(questionText()).toBe(question)
    expect(screen.getByText('Question 3 of 3')).toBeInTheDocument()
    expect(loadAttempts()).toHaveLength(2)
    expect(loadActiveSession()?.state.session.attempted).toBe(2)
  })

  it('puts the picked answer back', async () => {
    const user = userEvent.setup()
    const first = renderApp('/practice/session', { config })
    await user.click(choice(3))
    const picked = choice(3).getAttribute('aria-label')
    first.unmount()

    renderApp('/practice/session', refreshState())
    expect(choice(3)).toHaveAttribute('aria-label', picked)
    expect(choice(3)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeEnabled()
  })

  it('does not put a picked answer on a later question', async () => {
    const user = userEvent.setup()
    const first = renderApp('/practice/session', { config })
    await user.click(choice(1))
    first.unmount()
    renderApp('/practice/session', refreshState())
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    await user.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(
      [...document.querySelectorAll('.answer')].every(
        (a) => a.getAttribute('aria-pressed') === 'false',
      ),
    ).toBe(true)
  })

  it('moves on to a new question if the page was refreshed after answering', async () => {
    const user = userEvent.setup()
    const first = renderApp('/practice/session', { config })
    await answer(user, { next: false })
    const answered = questionText()
    first.unmount()

    renderApp('/practice/session', refreshState())
    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
    expect(questionText()).not.toBe(undefined)
    expect(loadAttempts()).toHaveLength(1)
    expect(answered).toBeTruthy()
  })

  it('goes to the summary if the page was refreshed after the last answer', async () => {
    const user = userEvent.setup()
    const one = { ...config, sessionLength: 1 }
    const first = renderApp('/practice/session', { config: one })
    await answer(user, { next: false })
    first.unmount()

    renderApp('/practice/session', { config: one, runId: loadActiveSession()?.state.session.id })
    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
    expect(loadSessions()[0].completedAt).toBeTruthy()
  })

  it('records which session the page shows, so the address can be refreshed', async () => {
    const router = createMemoryRouter([{ path: '*', element: <AppRoutes /> }], {
      initialEntries: [{ pathname: '/practice/session', state: { config } }],
    })
    render(
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>,
    )
    await screen.findByText('Question 1 of 3')
    expect(router.state.location.state.runId).toBe(loadActiveSession()?.state.session.id)
  })

  it('starts a new session when asked to, replacing an older saved one', async () => {
    const first = renderApp('/practice/session', { config })
    const oldId = loadActiveSession()?.state.session.id
    first.unmount()
    renderApp('/practice/session', { config })
    expect(loadActiveSession()?.state.session.id).not.toBe(oldId)
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
  })

  it('continues the saved session from the continue button or with no setup chosen', async () => {
    const user = userEvent.setup()
    const first = renderApp('/practice/session', { config })
    await answer(user)
    const question = questionText()
    first.unmount()

    const viaResume = renderApp('/practice/session', { resume: true })
    expect(questionText()).toBe(question)
    viaResume.unmount()

    renderApp('/practice/session')
    expect(questionText()).toBe(question)
  })

  it('goes to the setup page when there is nothing to restore', () => {
    renderApp('/practice/session')
    expect(screen.getByRole('heading', { name: 'Set Up Your Practice' })).toBeInTheDocument()
  })

  it('ignores a damaged save', () => {
    localStorage.setItem(STORAGE_KEYS.activeSession, '{"broken":')
    renderApp('/practice/session')
    expect(screen.getByRole('heading', { name: 'Set Up Your Practice' })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEYS.activeSession)).toBeNull()
  })
})

describe('offering to continue', () => {
  async function leaveASessionRunning() {
    const user = userEvent.setup()
    const first = renderApp('/practice/session', { config })
    await answer(user)
    const question = questionText()
    first.unmount()
    return { user, question }
  }

  it('is offered on the home page and continues the same session', async () => {
    const { user, question } = await leaveASessionRunning()
    renderApp('/')
    expect(screen.getByText(/at question 2 of 3/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue Session' }))
    expect(questionText()).toBe(question)
  })

  it('is offered on the setup page, and Start Fresh forgets the session', async () => {
    const { user } = await leaveASessionRunning()
    renderApp('/practice/setup')
    await user.click(screen.getByRole('button', { name: 'Start Fresh' }))
    expect(screen.queryByText(/pick up where you left off/i)).not.toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
  })

  it('is not offered when nothing is running', () => {
    renderApp('/')
    expect(screen.queryByText(/pick up where you left off/i)).not.toBeInTheDocument()
  })
})

describe('leaving a running session', () => {
  const nav = (name: string) =>
    within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name })

  it('asks first when a link would leave the session', async () => {
    const user = userEvent.setup()
    renderDataRouter('/practice/session', { config })
    await user.click(nav('Home'))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Leave this session?')
    expect(
      screen.queryByRole('heading', { name: /welcome to math practice/i }),
    ).not.toBeInTheDocument()
  })

  it('lets the student carry on practicing', async () => {
    const user = userEvent.setup()
    renderDataRouter('/practice/session', { config })
    await user.click(nav('Statistics'))
    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    expect(loadActiveSession()).not.toBeNull()
  })

  it('ends the session and leaves when asked, counting the answers so far', async () => {
    const user = userEvent.setup()
    renderDataRouter('/practice/session', { config })
    await answer(user)
    await user.click(nav('Statistics'))
    await user.click(screen.getByRole('button', { name: 'End Session and Leave' }))

    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Session Summary' })).not.toBeInTheDocument()
    expect(loadActiveSession()).toBeNull()
    expect(loadSessions()[0]).toMatchObject({ attempted: 1 })
    expect(loadSessions()[0].completedAt).toBeTruthy()
  })

  it('also asks when the app itself tries to navigate away', async () => {
    const router = renderDataRouter('/practice/session', { config })
    await screen.findByText('Question 1 of 3')
    await router.navigate('/settings')
    expect(await screen.findByRole('dialog')).toHaveTextContent('Leave this session?')
  })

  it('does not ask after the session is finished', async () => {
    const user = userEvent.setup()
    renderDataRouter('/practice/session', { config: { ...config, sessionLength: 1 } })
    await answer(user, { nextLabel: 'See Results' })
    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Return Home' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /welcome to math practice/i })).toBeInTheDocument()
  })

  it('does not ask after a continuous session is ended on purpose', async () => {
    const user = userEvent.setup()
    renderDataRouter('/practice/session', { config: { ...config, sessionLength: 'continuous' } })
    await answer(user)
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }))
    expect(screen.getByRole('heading', { name: 'Session Summary' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not ask on other pages', async () => {
    const user = userEvent.setup()
    renderDataRouter('/settings')
    await user.click(nav('Home'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
