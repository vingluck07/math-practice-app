import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import AppProvider from '../../app/AppProvider'
import { STORAGE_KEYS, writeItem } from '../../services/storageService'
import type { Question } from '../../types/question'
import { FEEDBACK_MESSAGES } from '../../utils/feedback'
import QuestionCard from './QuestionCard'

const question: Question = {
  id: 'q1',
  operation: 'multiplication',
  firstOperand: 7,
  secondOperand: 8,
  displayText: '7 × 8 = ?',
  correctAnswer: 56,
  choices: [48, 54, 56, 64],
  difficulty: 2,
  source: 'regular',
}

async function answer(choice: string, settings: object = {}) {
  writeItem(STORAGE_KEYS.settings, settings)
  const user = userEvent.setup()
  render(
    <AppProvider>
      <QuestionCard
        question={question}
        questionNumber={1}
        total={5}
        onResult={() => {}}
        onNext={() => {}}
      />
    </AppProvider>,
  )
  await user.click(screen.getByRole('button', { name: choice }))
  await user.click(screen.getByRole('button', { name: 'Flip Card' }))
  await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
  return document.querySelector('.card__feedback') as HTMLElement
}

const mentionsOne = (text: string | null, list: readonly string[]) =>
  list.some((m) => (text ?? '').includes(m))

describe('feedback after an answer', () => {
  it('cheers a correct pick with one of the positive messages', async () => {
    const feedback = await answer('Answer 3: 56')
    expect(feedback).toHaveTextContent('You picked the correct answer.')
    expect(mentionsOne(feedback.textContent, FEEDBACK_MESSAGES.correct)).toBe(true)
    expect(feedback).toHaveClass('card__feedback--celebrate')
  })

  it('supports a student who picked another answer and still shows the right one', async () => {
    const feedback = await answer('Answer 2: 54')
    expect(feedback).toHaveTextContent('The correct answer is 56.')
    expect(mentionsOne(feedback.textContent, FEEDBACK_MESSAGES.incorrect)).toBe(true)
    expect(feedback).not.toHaveClass('card__feedback--celebrate')
  })

  it('is plain, with no cheering or celebration, when cheering messages are off', async () => {
    const correct = await answer('Answer 3: 56', { feedbackEffectsEnabled: false })
    expect(correct.textContent).toBe('✓ You picked the correct answer.')
    expect(correct).not.toHaveClass('card__feedback--celebrate')
  })

  it('is plain for a different answer when cheering messages are off', async () => {
    const feedback = await answer('Answer 1: 48', { feedbackEffectsEnabled: false })
    expect(feedback.textContent).toBe('The correct answer is 56.')
  })

  it('skips the celebration, but keeps the message, when card animation is off', async () => {
    const feedback = await answer('Answer 3: 56', { cardAnimationEnabled: false })
    expect(mentionsOne(feedback.textContent, FEEDBACK_MESSAGES.correct)).toBe(true)
    expect(feedback).not.toHaveClass('card__feedback--celebrate')
  })
})
