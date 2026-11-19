import nodemailer from 'nodemailer'
import { config } from '../config.js'

/** "Tawseel <me@gmail.com>" → { name: 'Tawseel', email: 'me@gmail.com' } */
export function parseAddress(value) {
  const match = /^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/.exec(value)
  return match ? { name: match[1] || undefined, email: match[2] } : { email: value.trim() }
}

/** Which provider will send emails with the current settings. */
export function mailProvider() {
  if (config.brevoApiKey) return 'brevo'
  if (config.resendApiKey) return 'resend'
  if (config.smtp.host) return 'smtp'
  return 'console'
}

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Email API ${res.status}: ${detail.slice(0, 300)}`)
  }
}

let smtpTransport
const providers = {
  // https://developers.brevo.com/reference/sendtransacemail
  brevo: ({ to, subject, text, html }) =>
    postJson('https://api.brevo.com/v3/smtp/email', { 'api-key': config.brevoApiKey }, {
      sender: parseAddress(config.mailFrom),
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),

  // https://resend.com/docs/api-reference/emails/send-email (needs a verified domain to reach other people)
  resend: ({ to, subject, text, html }) =>
    postJson('https://api.resend.com/emails', { Authorization: `Bearer ${config.resendApiKey}` }, {
      from: config.mailFrom,
      to: [to],
      subject,
      text,
      html,
    }),

  smtp: (message) => {
    smtpTransport ??= nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
    return smtpTransport.sendMail({ from: config.mailFrom, ...message })
  },

  // Development and tests: nothing is sent.
  console: async () => {},
}

export async function sendEmail(message) {
  return providers[mailProvider()](message)
}

export function passwordResetEmail(link, minutes = config.resetTokenMinutes) {
  const text = `مرحباً،\n\nوصلنا طلب لإعادة تعيين كلمة المرور لحسابك على توصيل.\nافتح الرابط التالي لاختيار كلمة مرور جديدة (صالح لمدة ${minutes} دقيقة):\n${link}\n\nإذا ما طلبت هذا، تجاهل الرسالة وكلمة مرورك ما رح تتغير.\n\nفريق توصيل`
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<body style="margin:0;padding:24px;background:#fafaf9;font-family:Tahoma,Arial,sans-serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:28px;text-align:right">
    <div style="font-size:22px;font-weight:bold;color:#f2622e;margin-bottom:16px">توصيل</div>
    <p style="margin:0 0 12px;font-size:16px">مرحباً،</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7">وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. اضغط على الزر لاختيار كلمة مرور جديدة.</p>
    <p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#f2622e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:bold;font-size:15px">تعيين كلمة مرور جديدة</a></p>
    <p style="margin:0 0 8px;font-size:13px;color:#78716c">الرابط صالح لمدة ${minutes} دقيقة ويعمل مرة واحدة.</p>
    <p style="margin:0 0 16px;font-size:13px;color:#78716c">إذا ما طلبت هذا، تجاهل الرسالة وكلمة مرورك ما رح تتغير.</p>
    <p style="margin:0;font-size:12px;color:#a8a29e;word-break:break-all;direction:ltr;text-align:left">${link}</p>
  </div>
</body>
</html>`
  return { subject: 'توصيل – إعادة تعيين كلمة المرور', text, html }
}

export async function sendPasswordResetEmail(to, link) {
  if (mailProvider() === 'console' && process.env.NODE_ENV !== 'test') {
    console.log(`[mail] No email provider set. Password reset link for ${to}: ${link}`)
  }
  await sendEmail({ to, ...passwordResetEmail(link) })
}
