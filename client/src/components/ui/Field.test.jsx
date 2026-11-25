import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Field } from './Field'

describe('Field', () => {
  it('shows and hides a password with the eye button', async () => {
    render(<Field label="كلمة المرور" type="password" defaultValue="secret123" />)
    const input = screen.getByLabelText('كلمة المرور', { selector: 'input' })
    expect(input).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'إظهار كلمة المرور' }))
    expect(input).toHaveAttribute('type', 'text')

    const hide = screen.getByRole('button', { name: 'إخفاء كلمة المرور' })
    expect(hide).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(hide)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('has no eye button for other inputs', () => {
    render(<Field label="الاسم" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
