// Shows the restaurant image, or a colored placeholder with an emoji for its category.
const EMOJI = {
  برجر: '🍔',
  بيتزا: '🍕',
  حلويات: '🍰',
  شاورما: '🌯',
  مشروبات: '☕',
  فلافل: '🧆',
  مشاوي: '🍢',
  'مأكولات بحرية': '🐟',
  'مأكولات شعبية': '🍲',
  فطائر: '🥙',
}
const GRADIENTS = [
  'from-orange-200 to-rose-200',
  'from-amber-200 to-orange-300',
  'from-rose-200 to-pink-300',
  'from-lime-200 to-emerald-200',
  'from-sky-200 to-indigo-200',
]

export function RestaurantCover({ restaurant, className = '' }) {
  if (restaurant.imageUrl) {
    return <img src={restaurant.imageUrl} alt="" className={`object-cover ${className}`} loading="lazy" />
  }
  return (
    <div className={`grid place-items-center bg-gradient-to-br ${GRADIENTS[restaurant.id % GRADIENTS.length]} ${className}`}>
      <span className="text-4xl drop-shadow-sm sm:text-5xl" aria-hidden>
        {EMOJI[restaurant.category] || '🍽️'}
      </span>
    </div>
  )
}
