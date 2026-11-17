import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrderProgress } from './OrderProgress'
import { StatusBadge } from './StatusBadge'

describe('OrderProgress', () => {
  it('marks the current step', () => {
    render(<OrderProgress status="PREPARING" />)
    const current = screen.getByText('قيد التحضير').closest('li')
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })

  it('shows a message for rejected orders', () => {
    render(<OrderProgress status="REJECTED" />)
    expect(screen.getByText(/رفض هذا الطلب/)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('shows the Arabic label', () => {
    render(<StatusBadge status="ON_THE_WAY" />)
    expect(screen.getByText('في الطريق')).toBeInTheDocument()
  })
})
