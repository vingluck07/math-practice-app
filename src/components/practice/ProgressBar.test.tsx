import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProgressBar from './ProgressBar'

describe('ProgressBar', () => {
  it('exposes its progress to screen readers', () => {
    render(<ProgressBar completed={3} total={10} />)
    const bar = screen.getByRole('progressbar', { name: 'Session progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 10 questions done')
  })

  it('fills in proportion to the questions done', () => {
    const { container } = render(<ProgressBar completed={5} total={20} />)
    expect(container.querySelector('.progress__fill')).toHaveStyle({ width: '25%' })
  })
})
