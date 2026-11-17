import nodemailer from 'nodemailer'
import { config } from '../config.js'

// Without SMTP settings (development, tests) emails are not sent:
// they are returned as JSON and the reset link is printed to the console.
const transporter = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  : nodemailer.createTransport({ jsonTransport: true })

export async function sendPasswordResetEmail(to, link) {
  if (!config.smtp.host && process.env.NODE_ENV !== 'test') {
    console.log(`[mail] Password reset link for ${to}: ${link}`)
  }
  await transporter.sendMail({
    from: config.mailFrom,
    to,
    subject: 'Tawseel – إعادة تعيين كلمة المرور',
    text: `لإعادة تعيين كلمة المرور افتح الرابط التالي (صالح لمدة ${config.resetTokenMinutes} دقيقة):\n${link}`,
    html: `<p>لإعادة تعيين كلمة المرور اضغط على الرابط التالي (صالح لمدة ${config.resetTokenMinutes} دقيقة):</p><p><a href="${link}">${link}</a></p>`,
  })
}
