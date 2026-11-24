// Runs on every Railway start (see the root package.json "migrate" script).
// Adds photos to the demo dishes and restaurants that don't have one yet.
import { PrismaClient } from '@prisma/client'
import { applyDishPhotos } from '../src/lib/dishPhotos.js'

const prisma = new PrismaClient()
try {
  const { dishes, covers } = await applyDishPhotos(prisma)
  console.log(`[photos] Added photos to ${dishes} dishes and ${covers} restaurants`)
} catch (e) {
  // Never block the server from starting because of photos.
  console.error(`[photos] Could not add photos: ${e.message}`)
} finally {
  await prisma.$disconnect()
}
