import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Question } from '../../types/question'
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

function setup(props: Partial<React.ComponentProps<typeof QuestionCard>> = {}) {
  const onResult = vi.fn()
  const onNext = vi.fn()
  const view = render(
    <QuestionCard
      question={question}
      questionNumber={3}
      total={10}
      onResult={onResult}
      onNext={onNext}
      {...props}
    />,
  )
  return { onResult, onNext, ...view }
}

const flipButton = () => screen.getByRole('button', { name: 'Flip Card' })

describe('QuestionCard front', () => {
  it('shows the question number, total, problem and four answer choices', () => {
    setup()
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /7 times 8 equals what/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Answer \d: / })).toHaveLength(4)
  })

  it('drops the total for continuous practice', () => {
    setup({ questionNumber: 4, total: 'continuous' })
    expect(screen.getByText('Question 4')).toBeInTheDocument()
  })

  it('disables Flip Card until an answer is selected', async () => {
    const user = userEvent.setup()
    setup()
    expect(flipButton()).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Answer 2: 54' }))
    expect(flipButton()).toBeEnabled()
  })

  it('highlights the selected answer and lets it change before flipping', async () => {
    const user = userEvent.setup()
    setup()
    const first = screen.getByRole('button', { name: 'Answer 1: 48' })
    const third = screen.getByRole('button', { name: 'Answer 3: 56' })
    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    await user.click(third)
    expect(third).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveAttribute('aria-pressed', 'false')
  })

  it('selects answers with the number keys', async () => {
    const user = userEvent.setup()
    setup()
    await user.keyboard('4')
    expect(screen.getByRole('button', { name: 'Answer 4: 64' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(flipButton()).toBeEnabled()
  })
})

describe('QuestionCard flipping', () => {
  async function flipWith(choiceName: string) {
    const user = userEvent.setup()
    const view = setup()
    await user.click(screen.getByRole('button', { name: choiceName }))
    await user.click(flipButton())
    return { user, ...view }
  }

  it('asks for a confidence check without revealing the correct answer', async () => {
    await flipWith('Answer 2: 54')
    expect(screen.getByRole('heading', { name: '7 × 8 = ?' })).toBeInTheDocument()
    expect(screen.getByText('Your answer: 54')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I Got It Wrong' })).toBeInTheDocument()
    expect(screen.queryByText(/correct answer is/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '7 × 8 = 56' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next Question' })).not.toBeInTheDocument()
  })

  it('reveals the correct answer after the student decides', async () => {
    const { user } = await flipWith('Answer 2: 54')
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(screen.getByRole('heading', { name: '7 × 8 = 56' })).toBeInTheDocument()
    expect(screen.getByText('Your answer: 54')).toBeInTheDocument()
    expect(screen.getByText(/the correct answer is 56/i)).toBeInTheDocument()
    expect(screen.getByText(/you said: i got it wrong/i)).toBeInTheDocument()
  })

  it('congratulates a correct pick after the reveal', async () => {
    const { user } = await flipWith('Answer 3: 56')
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(screen.getByText(/you picked the correct answer/i)).toBeInTheDocument()
  })

  it('hides the front from keyboard and screen readers after flipping, and locks choices', async () => {
    const { container } = await flipWith('Answer 2: 54')
    expect(container.querySelector('.flip__face--front')).toHaveAttribute('inert')
    expect(container.querySelector('.flip__face--back')).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', { name: 'Answer 1: 48' })).toBeDisabled()
  })

  it('ignores number keys after flipping', async () => {
    const { user } = await flipWith('Answer 2: 54')
    await user.keyboard('1')
    expect(screen.getByText('Your answer: 54')).toBeInTheDocument()
  })

  it('reports the confidence check once and removes both buttons', async () => {
    const { user, onResult } = await flipWith('Answer 2: 54')
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult).toHaveBeenCalledWith(true, 54)
    expect(screen.queryByRole('button', { name: 'I Got It Right' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'I Got It Wrong' })).not.toBeInTheDocument()
  })

  it('reports an "I got it wrong" check', async () => {
    const { user, onResult } = await flipWith('Answer 1: 48')
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }))
    expect(onResult).toHaveBeenCalledWith(false, 48)
  })

  it('moves on only when Next Question is pressed', async () => {
    const { user, onNext } = await flipWith('Answer 2: 54')
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(onNext).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Next Question' }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})

describe('QuestionCard without animation', () => {
  it('still works and uses the static layout', async () => {
    const user = userEvent.setup()
    const { container } = setup({ animate: false })
    expect(container.querySelector('.flip')).toHaveClass('flip--static')
    await user.click(screen.getByRole('button', { name: 'Answer 3: 56' }))
    await user.click(flipButton())
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }))
    expect(screen.getByRole('heading', { name: '7 × 8 = 56' })).toBeInTheDocument()
  })

  it('uses the animated layout by default', () => {
    const { container } = setup()
    expect(container.querySelector('.flip')).toHaveClass('flip--animated')
  })
})
