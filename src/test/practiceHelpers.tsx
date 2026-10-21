import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AppProvider from '../app/AppProvider'
import AppRoutes from '../app/AppRoutes'

export type User = ReturnType<typeof userEvent.setup>

export function renderAppAt(path: string, state?: unknown) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

/** The problem on screen, such as { operation: '+', answer: 7 }. */
export function currentProblem() {
  const text = document.querySelector('.card__question span[aria-hidden]')?.textContent ?? ''
  const [, a, op, b] = /(\d+) ([+−×÷]) (\d+)/.exec(text) ?? []
  const answer = { '+': +a + +b, '−': +a - +b, '×': +a * +b, '÷': +a / +b }[op as '+']
  return { operation: op, answer }
}

/** Picks an answer (right or wrong), flips the card, says "I Got It Right" and moves on. */
export async function answerQuestion(user: User, nextLabel: string, pickCorrect = true) {
  const { answer } = currentProblem()
  const choices = screen.getAllByRole('button', { name: /^Answer \d: / })
  const value = (el: HTMLElement) => Number(el.getAttribute('aria-label')?.split(': ')[1])
  await user.click(choices.find((c) => (value(c) === answer) === pickCorrect) as HTMLElement)
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
  await user.click(screen.getByRole('button', { name: nextLabel }))
}
