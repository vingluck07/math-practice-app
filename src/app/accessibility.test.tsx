import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveMistakePatterns } from '../services/practiceStorage'
import { STORAGE_KEYS, writeItem } from '../services/storageService'
import { makeAttempt, makePattern, makeSession } from '../test/factories'
import { mockReducedMotion } from '../test/mediaHelpers'
import type { PracticeConfig } from '../types/session'
import AppProvider from './AppProvider'
import AppRoutes from './AppRoutes'

/** The real stylesheets, read as plain text so the colour checks use the colours the app ships. */
const cssFiles = import.meta.glob('../**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const appCss = cssFiles['../index.css'] ?? ''

afterEach(() => vi.unstubAllGlobals())

function renderApp(path: string, state?: unknown) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

const config: PracticeConfig = { operations: ['addition'], difficulty: 1, sessionLength: 5 }

describe('keyboard use', () => {
  it('has a skip link as the first stop that moves focus to the main content', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })

  it('never uses a positive tab order, so Tab follows the page order', () => {
    renderApp('/practice/session', { config })
    const tabIndexes = [...document.querySelectorAll('[tabindex]')].map((e) =>
      Number(e.getAttribute('tabindex')),
    )
    expect(tabIndexes.every((n) => n <= 0)).toBe(true)
  })

  it('activates buttons with both Enter and Space', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await user.click(screen.getByRole('button', { name: 'Answer 1: ' + answerValue(1) }))
    const flip = screen.getByRole('button', { name: 'Flip Card' })
    flip.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toBeInTheDocument()
  })

  it('also flips the card with the Space key', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await user.keyboard('2')
    screen.getByRole('button', { name: 'Flip Card' }).focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toBeInTheDocument()
  })

  it('ignores number keys typed into a text field', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    await user.keyboard('3')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
    input.remove()
  })

  it('ignores number keys while a dialog is open', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config: { ...config, sessionLength: 'continuous' } })
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }))
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
  })

  it('ignores number keys pressed with Ctrl', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await user.keyboard('{Control>}1{/Control}')
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled()
  })
})

function answerValue(position: number): string {
  const button = document.querySelectorAll<HTMLElement>('.answer')[position - 1]
  return button?.getAttribute('aria-label')?.split(': ')[1] ?? ''
}

describe('screen readers', () => {
  it('announces each question and the session progress politely', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    const live = screen
      .getAllByRole('status')
      .find((s) => /Question 1 of 5/.test(s.textContent ?? ''))
    expect(live).toHaveTextContent('Question 1 of 5. 0 answered, 0 correct so far.')

    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    await user.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(
      screen
        .getAllByRole('status')
        .some((s) => /^Question 2 of 5\. 1 answered/.test(s.textContent ?? '')),
    ).toBe(true)
  })

  it('announces the revealed answer', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    const quiet = screen
      .getAllByRole('status')
      .filter((s) => /Answer revealed/.test(s.textContent ?? ''))
    expect(quiet).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    const revealed = screen
      .getAllByRole('status')
      .find((s) => /Answer revealed/.test(s.textContent ?? ''))
    expect(revealed).toHaveTextContent(
      /Answer revealed\. \d+ plus \d+ equals \d+\. You picked \d+\./,
    )
  })

  it('moves focus to the new question and then to the answer', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    expect(document.activeElement).toHaveClass('card__question')
    expect(document.activeElement).toHaveTextContent(/plus/)
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(document.activeElement).toHaveClass('card__question')
    expect(document.activeElement).toHaveTextContent(/= \d+$/)
  })

  it('gives every button, link and field on every page an accessible name', () => {
    writeItem(STORAGE_KEYS.attempts, [makeAttempt({ correct: false })])
    writeItem(STORAGE_KEYS.sessions, [makeSession()])
    saveMistakePatterns([makePattern(), makePattern({ id: 'x', mastered: true })])
    const pages: [string, unknown?][] = [
      ['/'],
      ['/practice/setup'],
      ['/practice/session', { config }],
      ['/practice/summary', { session: makeSession(), attempts: [] }],
      ['/statistics'],
      ['/settings'],
      ['/nowhere'],
    ]
    for (const [path, state] of pages) {
      const view = renderApp(path, state)
      const controls = screen
        .queryAllByRole('button')
        .concat(
          screen.queryAllByRole('link'),
          screen.queryAllByRole('checkbox'),
          screen.queryAllByRole('radio'),
          screen.queryAllByRole('progressbar'),
        )
      expect(controls.length, path).toBeGreaterThan(0)
      for (const control of controls) expect(control, path).toHaveAccessibleName()
      view.unmount()
    }
  })

  it('has one main landmark and one top-level heading per page', () => {
    for (const path of ['/', '/practice/setup', '/statistics', '/settings']) {
      const view = renderApp(path)
      expect(screen.getAllByRole('main'), path).toHaveLength(1)
      expect(
        within(screen.getByRole('main')).getAllByRole('heading', { level: 1 }),
        path,
      ).toHaveLength(1)
      view.unmount()
    }
  })
})

describe('reduced motion', () => {
  it('uses the no-animation card when the device asks for less motion', () => {
    mockReducedMotion(true)
    const { container } = renderApp('/practice/session', { config })
    expect(container.querySelector('.flip')).toHaveClass('flip--static')
  })

  it('animates the card when allowed by both the device and the setting', () => {
    mockReducedMotion(false)
    const { container } = renderApp('/practice/session', { config })
    expect(container.querySelector('.flip')).toHaveClass('flip--animated')
  })

  it('still uses the static card when the app setting is off', () => {
    mockReducedMotion(false)
    writeItem(STORAGE_KEYS.settings, { cardAnimationEnabled: false })
    const { container } = renderApp('/practice/session', { config })
    expect(container.querySelector('.flip')).toHaveClass('flip--static')
  })

  it('still changes the card clearly without animation', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByRole('button', { name: 'Flip Card', hidden: true })).not.toBeVisible()
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toBeVisible()
  })

  it('explains on the settings page that the device setting is being followed', () => {
    mockReducedMotion(true)
    renderApp('/settings')
    expect(screen.getByText(/your device asks for less motion/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /card animation/i })).toBeInTheDocument()
  })
})

describe('visual accessibility', () => {
  function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  /** Reads a colour token (like --color-text) from the real stylesheet. */
  const token = (name: string) =>
    new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(appCss)?.[1] ?? ''

  const text = token('--color-text')
  const muted = token('--color-muted')
  const primary = token('--color-primary')
  const error = token('--color-error')
  const controlBorder = token('--color-control-border')
  const surfaces = ['#ffffff', '#fffaf0', '#fff8e7', '#ffc4a6']

  it('reads every colour token it checks', () => {
    for (const value of [text, muted, primary, error, controlBorder]) expect(value).toMatch(/^#/)
  })

  it.each([
    ['main text', () => text],
    ['muted text', () => muted],
    ['error text', () => error],
  ])('%s has at least 4.5:1 contrast on every page surface', (_, color) => {
    for (const surface of surfaces) expect(contrast(color(), surface)).toBeGreaterThanOrEqual(4.5)
  })

  it('link and primary-coloured text has at least 4.5:1 contrast on white and cream', () => {
    for (const surface of ['#ffffff', '#fffaf0']) {
      expect(contrast(primary, surface)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('controls have a border with at least 3:1 contrast', () => {
    for (const surface of ['#ffffff', '#fffaf0']) {
      expect(contrast(controlBorder, surface)).toBeGreaterThanOrEqual(3)
    }
  })

  it('button text has at least 4.5:1 contrast across every button gradient', () => {
    const buttonCss = cssFiles['../components/common/Button.css'] ?? ''
    const colors = [...buttonCss.matchAll(/--btn-(?:hover-)?(?:from|to):\s*(#[0-9a-f]{6})/gi)]
    expect(colors.length).toBe(12)
    const [primaryFrom, primaryTo, primaryHoverFrom, primaryHoverTo] = colors
      .slice(0, 4)
      .map((c) => c[1])
    for (const bg of [primaryFrom, primaryTo, primaryHoverFrom, primaryHoverTo]) {
      expect(contrast('#ffffff', bg)).toBeGreaterThanOrEqual(4.5)
    }
    const secondary = colors.slice(4, 8).map((c) => c[1])
    for (const bg of secondary) expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5)
    const accent = colors.slice(8, 12).map((c) => c[1])
    for (const bg of accent) expect(contrast('#ffffff', bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('respects the browser text size by not fixing the base font size in pixels', () => {
    expect(/:root\s*{[^}]*font-size:\s*100%/.test(appCss)).toBe(true)
    expect(/:root\s*{[^}]*font-size:\s*\d+px/.test(appCss)).toBe(false)
  })

  it('shows a check mark and the word "selected" state for chosen answers, not only colour', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    const first = screen.getAllByRole('button', { name: /^Answer \d: / })[0]
    expect(first).toHaveAttribute('aria-pressed', 'false')
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(first.textContent).toContain('✓')
  })

  it('says whether the answer was right in words as well as style', async () => {
    const user = userEvent.setup()
    renderApp('/practice/session', { config })
    await user.keyboard('1')
    await user.click(screen.getByRole('button', { name: 'Flip Card' }))
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(
      screen.getByText(/You picked the correct answer|The correct answer is \d+/),
    ).toBeInTheDocument()
  })
})
