import bcrypt from 'bcryptjs'

/**
 * Makes sure an admin account exists with the given email and password.
 * - Creates it if missing.
 * - If the email belongs to an existing account, makes it an active admin and sets the password.
 * Returns 'created' | 'updated' | 'unchanged'.
 */
export async function ensureAdmin(prisma, { email, password, name = 'مدير الموقع' }) {
  email = email.trim().toLowerCase()
  if (!email.includes('@')) throw new Error('ADMIN_EMAIL is not a valid email')
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    await prisma.user.create({ data: { name, email, role: 'ADMIN', emailVerifiedAt: new Date(), passwordHash: await bcrypt.hash(password, 10) } })
    return 'created'
  }

  const samePassword = await bcrypt.compare(password, existing.passwordHash)
  if (existing.role === 'ADMIN' && existing.isActive && existing.emailVerifiedAt && samePassword) return 'unchanged'

  await prisma.user.update({
    where: { id: existing.id },
    data: { role: 'ADMIN', isActive: true, emailVerifiedAt: existing.emailVerifiedAt ?? new Date(), ...(!samePassword && { passwordHash: await bcrypt.hash(password, 10) }) },
  })
  return 'updated'
}
