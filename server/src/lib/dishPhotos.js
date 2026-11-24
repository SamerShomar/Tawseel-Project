import fs from 'node:fs'
import path from 'node:path'

// Photos for the demo dishes and restaurant covers. The list lives with the client,
// which also uses it for the photo credits page.
const DATA_FILE = path.resolve(import.meta.dirname, '../../../client/src/data/dish-photos.json')

export function loadDishPhotos(file = DATA_FILE) {
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/**
 * Gives the demo dishes and restaurants their photos.
 * Only fills empty images, matched by restaurant name + dish name,
 * so photos added by restaurant owners are never replaced. Safe to run on every deploy.
 */
export async function applyDishPhotos(prisma, data = loadDishPhotos()) {
  if (!data) return { dishes: 0, covers: 0 }
  let dishes = 0
  let covers = 0
  for (const d of data.dishes) {
    const { count } = await prisma.menuItem.updateMany({
      where: { name: d.name, imageUrl: null, restaurant: { name: d.restaurant } },
      data: { imageUrl: d.image },
    })
    dishes += count
  }
  for (const c of data.covers) {
    const { count } = await prisma.restaurant.updateMany({ where: { name: c.restaurant, imageUrl: null }, data: { imageUrl: c.image } })
    covers += count
  }
  return { dishes, covers }
}
