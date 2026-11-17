import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import LoginPage from './LoginPage'

const json = (status, body) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>customer home</p>} />
          <Route path="/dashboard" element={<p>owner dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('البريد الإلكتروني'), 'a@test.com')
  await user.type(screen.getByLabelText('كلمة المرور'), 'password123')
  await user.click(screen.getByRole('button', { name: 'دخول' }))
}

afterEach(() => vi.unstubAllGlobals())

describe('LoginPage', () => {
  it('shows the server error on wrong credentials', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(401, { error: 'البريد أو كلمة المرور غير صحيحة' })))
    renderLogin()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent('البريد أو كلمة المرور غير صحيحة')
  })

  it('saves the token and sends a restaurant owner to the dashboard', async () => {
    const fetchMock = vi.fn(() => json(200, { token: 'tkn', user: { id: 1, name: 'Owner', role: 'RESTAURANT_OWNER' } }))
    vi.stubGlobal('fetch', fetchMock)
    renderLogin()
    await fillAndSubmit()

    expect(await screen.findByText('owner dashboard')).toBeInTheDocument()
    expect(localStorage.getItem('tawseel_token')).toBe('tkn')
    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/auth\/login$/)
    expect(JSON.parse(options.body)).toEqual({ email: 'a@test.com', password: 'password123' })
  })
})
