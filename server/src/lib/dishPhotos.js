import fs from 'node:fs'
import path from 'node:path'

// Photos for the demo dishes and restaurant covers. The list lives with the client,
// which also uses it for the photo credits page.
const DATA_FILE = path.resolve(import.meta.dirname, '../../../client/src/data/dish-photos.json')

export function loadDishPhotos(file = DATA_FILE) {
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// An image that is empty, or one of the site's own demo photos that has since been replaced in the list.
// Links added by restaurant owners (http…) never match, so they are never replaced.
const replaceable = (image) => ({ OR: [{ imageUrl: null }, { imageUrl: { startsWith: '/images/dishes/', not: image } }] })

/**
 * Gives the demo dishes and restaurants their photos, matched by restaurant name + dish name.
 * Fills empty images and swaps old demo photos for the current ones; photos added by
 * restaurant owners are never replaced. Safe to run on every deploy.
 */
export async function applyDishPhotos(prisma, data = loadDishPhotos()) {
  if (!data) return { dishes: 0, covers: 0 }
  let dishes = 0
  let covers = 0
  for (const d of data.dishes) {
    const { count } = await prisma.menuItem.updateMany({
      where: { name: d.name, restaurant: { name: d.restaurant }, ...replaceable(d.image) },
      data: { imageUrl: d.image },
    })
    dishes += count
  }
  for (const c of data.covers) {
    const { count } = await prisma.restaurant.updateMany({ where: { name: c.restaurant, ...replaceable(c.image) }, data: { imageUrl: c.image } })
    covers += count
  }
  return { dishes, covers }
}
