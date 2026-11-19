import { jest } from '@jest/globals'
import { config } from '../src/config.js'
import { mailProvider, parseAddress, passwordResetEmail, sendPasswordResetEmail } from '../src/lib/mailer.js'
import { api, prisma, registerUser, resetDb } from './helpers.js'

const original = { brevo: config.brevoApiKey, resend: config.resendApiKey, smtp: config.smtp.host, from: config.mailFrom }
let fetchSpy

beforeEach(() => {
  fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"messageId":"1"}', { status: 201 }))
})
afterEach(() => {
  fetchSpy.mockRestore()
  config.brevoApiKey = original.brevo
  config.resendApiKey = original.resend
  config.smtp.host = original.smtp
  config.mailFrom = original.from
})
afterAll(() => prisma.$disconnect())

describe('parseAddress', () => {
  it('splits a name and an email', () => {
    expect(parseAddress('Tawseel <me@gmail.com>')).toEqual({ name: 'Tawseel', email: 'me@gmail.com' })
    expect(parseAddress('  me@gmail.com ')).toEqual({ email: 'me@gmail.com' })
  })
})

describe('mailProvider', () => {
  it('picks Brevo, then Resend, then SMTP, then console', () => {
    config.brevoApiKey = undefined
    config.resendApiKey = undefined
    config.smtp.host = ''
    expect(mailProvider()).toBe('console')
    config.smtp.host = 'smtp.test'
    expect(mailProvider()).toBe('smtp')
    config.resendApiKey = 're_x'
    expect(mailProvider()).toBe('resend')
    config.brevoApiKey = 'xkeysib-x'
    expect(mailProvider()).toBe('brevo')
  })
})

describe('passwordResetEmail', () => {
  it('contains the link and the validity time, in Arabic', () => {
    const { subject, text, html } = passwordResetEmail('https://site.test/reset-password?token=abc', 30)
    expect(subject).toContain('إعادة تعيين كلمة المرور')
    expect(text).toContain('https://site.test/reset-password?token=abc')
    expect(html).toContain('href="https://site.test/reset-password?token=abc"')
    expect(html).toContain('dir="rtl"')
    expect(text).toContain('30 دقيقة')
  })
})

describe('sending', () => {
  it('sends through the Brevo API', async () => {
    config.brevoApiKey = 'xkeysib-test'
    config.mailFrom = 'Tawseel <team@gmail.com>'
    await sendPasswordResetEmail('user@test.com', 'https://site.test/r?token=1')

    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(options.headers['api-key']).toBe('xkeysib-test')
    const body = JSON.parse(options.body)
    expect(body.sender).toEqual({ name: 'Tawseel', email: 'team@gmail.com' })
    expect(body.to).toEqual([{ email: 'user@test.com' }])
    expect(body.htmlContent).toContain('https://site.test/r?token=1')
  })

  it('sends through the Resend API', async () => {
    config.brevoApiKey = undefined
    config.resendApiKey = 're_test'
    await sendPasswordResetEmail('user@test.com', 'https://site.test/r?token=1')

    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(options.headers.Authorization).toBe('Bearer re_test')
    expect(JSON.parse(options.body).to).toEqual(['user@test.com'])
  })

  it('throws with the API error when the provider refuses', async () => {
    config.brevoApiKey = 'bad'
    fetchSpy.mockResolvedValue(new Response('{"message":"Key not found"}', { status: 401 }))
    await expect(sendPasswordResetEmail('user@test.com', 'https://x')).rejects.toThrow('Email API 401')
  })
})

describe('POST /api/auth/forgot-password when the email provider fails', () => {
  it('still answers normally and logs the error', async () => {
    await resetDb()
    await registerUser({ email: 'reset@test.com' })
    config.brevoApiKey = 'bad'
    fetchSpy.mockResolvedValue(new Response('down', { status: 500 }))
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await api().post('/api/auth/forgot-password').send({ email: 'reset@test.com' })
    expect(res.status).toBe(200)
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('Could not send the password reset email'))
    errorLog.mockRestore()
  })
})
