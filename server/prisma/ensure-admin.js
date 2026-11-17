// Runs on every Railway start (see the root package.json "migrate" script).
// Creates or updates the admin account from the ADMIN_EMAIL and ADMIN_PASSWORD variables.
// If they are not set, nothing happens.
import { PrismaClient } from '@prisma/client'
import { ensureAdmin } from '../src/lib/ensureAdmin.js'

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
const prisma = new PrismaClient()

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.log('[admin] ADMIN_EMAIL / ADMIN_PASSWORD not set → skipping admin account')
} else {
  try {
    const result = await ensureAdmin(prisma, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    console.log(`[admin] Admin account ${ADMIN_EMAIL}: ${result}`)
  } catch (e) {
    // Never block the server from starting because of the admin account.
    console.error(`[admin] Could not set up the admin account: ${e.message}`)
  } finally {
    await prisma.$disconnect()
  }
}
