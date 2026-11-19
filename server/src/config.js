import 'dotenv/config'

const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production')
}

// CLIENT_URL can list several origins separated by commas (e.g. the Vercel URL and a custom domain).
// The first one is used in password-reset links.
// On Railway, RAILWAY_PUBLIC_DOMAIN is set automatically, so CLIENT_URL is optional there.
const defaultClientUrl = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : 'http://localhost:5173'

const clientUrls = (process.env.CLIENT_URL || defaultClientUrl)
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean)

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: '7d',
  clientUrl: clientUrls[0],
  corsOrigins: clientUrls,
  resetTokenMinutes: 30,
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Email provider, picked in this order: Brevo API → Resend API → SMTP → console only.
  // Railway blocks SMTP on free/trial plans, so an HTTP API (Brevo) is the reliable choice there.
  brevoApiKey: process.env.BREVO_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.MAIL_FROM || 'Tawseel <no-reply@tawseel.local>',
}
