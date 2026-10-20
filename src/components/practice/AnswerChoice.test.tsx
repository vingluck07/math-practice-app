import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AnswerChoice from './AnswerChoice'

describe('AnswerChoice', () => {
  it('is a button with an accessible label', () => {
    render(<AnswerChoice value={56} position={3} selected={false} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Answer 3: 56' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('shows its selected state', () => {
    render(<AnswerChoice value={56} position={3} selected onSelect={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('reports its value when clicked', async () => {
    const onSelect = vi.fn()
    render(<AnswerChoice value={56} position={3} selected={false} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(56)
  })

  it('cannot be changed when locked', async () => {
    const onSelect = vi.fn()
    render(<AnswerChoice value={56} position={3} selected={false} locked onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
