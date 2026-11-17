// Demo data: 4 restaurants with menus, their owners, and one customer.
// All demo accounts use the password: password123
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const restaurants = [
  {
    owner: { name: 'صاحب برجر هاوس', email: 'burger@tawseel.test' },
    name: 'برجر هاوس',
    description: 'برجر لحم مشوي على الفحم مع بطاطا مقرمشة',
    category: 'برجر',
    address: 'غزة – شارع عمر المختار',
    phone: '0599000001',
    menu: [
      ['كلاسيك برجر', 'لحم بقري، جبنة شيدر، خس، طماطم', 18, 'برجر'],
      ['دبل تشيز برجر', 'قطعتين لحم مع جبنة مضاعفة', 26, 'برجر'],
      ['تشيكن برجر', 'صدر دجاج مقرمش مع صوص خاص', 16, 'برجر'],
      ['بطاطا مقلية', 'حجم كبير', 7, 'إضافات'],
      ['حلقات بصل', '8 قطع', 8, 'إضافات'],
      ['كولا', 'علبة 330 مل', 3, 'مشروبات'],
    ],
  },
  {
    owner: { name: 'صاحب بيتزا روما', email: 'pizza@tawseel.test' },
    name: 'بيتزا روما',
    description: 'بيتزا إيطالية على الحطب بعجينة طازجة يومياً',
    category: 'بيتزا',
    address: 'غزة – الرمال',
    phone: '0599000002',
    menu: [
      ['بيتزا مارغريتا', 'صلصة طماطم، موزاريلا، ريحان', 25, 'بيتزا'],
      ['بيتزا خضار', 'فلفل، زيتون، فطر، بصل', 28, 'بيتزا'],
      ['بيتزا ببروني', 'ببروني بقري مع موزاريلا', 32, 'بيتزا'],
      ['بيتزا دجاج باربكيو', 'دجاج، صوص باربكيو، بصل أحمر', 34, 'بيتزا'],
      ['خبز بالثوم', '6 قطع', 9, 'مقبلات'],
      ['عصير برتقال', 'طازج', 6, 'مشروبات'],
    ],
  },
  {
    owner: { name: 'صاحب حلويات الشام', email: 'sweets@tawseel.test' },
    name: 'حلويات الشام',
    description: 'كنافة نابلسية وحلويات شرقية',
    category: 'حلويات',
    address: 'غزة – الشجاعية',
    phone: '0599000003',
    menu: [
      ['كنافة نابلسية', 'صحن وسط', 15, 'كنافة'],
      ['كنافة خشنة', 'صحن وسط', 15, 'كنافة'],
      ['بقلاوة مشكلة', 'نصف كيلو', 30, 'حلويات شرقية'],
      ['هريسة', 'صينية صغيرة', 20, 'حلويات شرقية'],
      ['قطايف بالجوز', '6 حبات', 12, 'حلويات شرقية'],
    ],
  },
  {
    owner: { name: 'صاحب شاورما الريف', email: 'shawarma@tawseel.test' },
    name: 'شاورما الريف',
    description: 'شاورما دجاج ولحم على الطريقة الشامية',
    category: 'شاورما',
    address: 'خانيونس – البلد',
    phone: '0599000004',
    menu: [
      ['سندويش شاورما دجاج', 'خبز صاج، ثومية، مخلل', 8, 'سندويشات'],
      ['سندويش شاورما لحم', 'خبز صاج، طحينة، بقدونس', 10, 'سندويشات'],
      ['وجبة عربي دجاج', 'مقطعة مع بطاطا وثومية', 20, 'وجبات'],
      ['صحن شاورما لحم', 'مع أرز وسلطة', 25, 'وجبات'],
      ['لبن عيران', 'كوب', 3, 'مشروبات'],
    ],
  },
]

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.user.deleteMany()

  await prisma.user.create({
    data: { name: 'زبون تجريبي', email: 'customer@tawseel.test', phone: '0599111111', passwordHash },
  })

  for (const r of restaurants) {
    await prisma.user.create({
      data: {
        ...r.owner,
        passwordHash,
        role: 'RESTAURANT_OWNER',
        restaurant: {
          create: {
            name: r.name,
            description: r.description,
            category: r.category,
            address: r.address,
            phone: r.phone,
            menuItems: {
              create: r.menu.map(([name, description, price, category]) => ({ name, description, price, category })),
            },
          },
        },
      },
    })
  }

  console.log(`Seeded ${restaurants.length} restaurants. Login with customer@tawseel.test / password123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
