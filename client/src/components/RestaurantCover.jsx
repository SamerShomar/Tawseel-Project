import { Beef, CakeSlice, Coffee, Croissant, Fish, Pizza, Salad, Sandwich, Soup, Flame, UtensilsCrossed } from 'lucide-react'

// Shows the restaurant image, or a soft tinted placeholder with a line icon for its category.
const ICONS = {
  برجر: Beef,
  بيتزا: Pizza,
  حلويات: CakeSlice,
  شاورما: Sandwich,
  مشروبات: Coffee,
  فلافل: Salad,
  مشاوي: Flame,
  'مأكولات بحرية': Fish,
  'مأكولات شعبية': Soup,
  فطائر: Croissant,
}
const TINTS = ['from-orange-50 to-amber-100', 'from-rose-50 to-orange-100', 'from-amber-50 to-yellow-100', 'from-stone-50 to-stone-100', 'from-red-50 to-rose-100']

export function RestaurantCover({ restaurant, className = '' }) {
  if (restaurant.imageUrl) {
    return <img src={restaurant.imageUrl} alt="" className={`object-cover ${className}`} loading="lazy" />
  }
  const Icon = ICONS[restaurant.category] || UtensilsCrossed
  return (
    <div className={`grid place-items-center bg-gradient-to-br ${TINTS[restaurant.id % TINTS.length]} ${className}`}>
      <Icon className="size-10 text-brand-700 sm:size-12" strokeWidth={1.25} aria-hidden />
    </div>
  )
}
