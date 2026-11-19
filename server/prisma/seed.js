// Demo data: 10 restaurants with menus, their owners, and one customer.
// All demo accounts use the password: password123
//
// npm run db:seed              → always resets the database to the demo data
// node prisma/seed.js --on-deploy (runs on every Railway deploy):
//   - seeds only when the database has no restaurants yet (first deploy), or
//   - when the SEED_DEMO_DATA variable is "reset" (remove the variable afterwards,
//     otherwise every deploy resets the data again)
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 10 demo restaurants in real areas of the Gaza Strip.
// Restaurant and owner names are made up for the demo (they are not real businesses).
// Prices are in shekels and based on real 2026 price levels in Gaza
// (e.g. shawarma sandwich ~25 ₪, beef burger ~35 ₪, shawarma meal with a drink ~60 ₪).
// Menu items: [name, description, price, section]
const restaurants = [
  {
    owner: { name: 'خالد منصور', email: 'shawarma@tawseel.test' },
    name: 'شاورما البيدر',
    description: 'شاورما دجاج ولحم على الفحم بخبز الصاج والعربي',
    category: 'شاورما',
    address: 'غزة – الرمال، شارع عمر المختار',
    phone: '0599000001',
    menu: [
      ['ساندويش شاورما دجاج', 'خبز صاج، ثومية، مخلل', 20, 'سندويشات'],
      ['ساندويش شاورما لحم', 'خبز صاج، طحينة، بقدونس وبصل', 28, 'سندويشات'],
      ['شاورما جريل', 'مشوية على الصاج مع جبنة', 25, 'سندويشات'],
      ['وجبة عربي دجاج', 'شاورما مقطعة مع بطاطا وثومية ومخلل', 45, 'وجبات'],
      ['صحن شاورما لحم', 'مع أرز وسلطة وطحينة', 55, 'وجبات'],
      ['بطاطا مقلية', 'صحن وسط', 10, 'إضافات'],
      ['ثومية إضافية', 'علبة صغيرة', 3, 'إضافات'],
      ['كولا', 'علبة 330 مل', 6, 'مشروبات'],
    ],
  },
  {
    owner: { name: 'يوسف حمدان', email: 'burger@tawseel.test' },
    name: 'برجر الميناء',
    description: 'برجر لحم بلدي مشوي مع صوصات البيت',
    category: 'برجر',
    address: 'غزة – شارع الرشيد قرب الميناء',
    phone: '0599000002',
    menu: [
      ['برجر لحم كلاسيك', 'لحم بقري، جبنة شيدر، خس، طماطم', 35, 'برجر'],
      ['دبل برجر', 'قطعتين لحم مع جبنة مضاعفة', 50, 'برجر'],
      ['تشيكن برجر كرسبي', 'صدر دجاج مقرمش مع صوص حار', 30, 'برجر'],
      ['وجبة برجر', 'برجر كلاسيك مع بطاطا ومشروب', 55, 'وجبات'],
      ['بطاطا بالجبنة', 'بطاطا مقلية مع صوص الجبنة', 15, 'إضافات'],
      ['حلقات بصل', '8 قطع', 12, 'إضافات'],
      ['ليمون بالنعنع', 'كاسة كبيرة', 10, 'مشروبات'],
    ],
  },
  {
    owner: { name: 'سامي الحلو', email: 'pizza@tawseel.test' },
    name: 'بيتزا الزيتونة',
    description: 'بيتزا على الحطب بعجينة طازجة كل يوم',
    category: 'بيتزا',
    address: 'غزة – حي النصر',
    phone: '0599000003',
    menu: [
      ['بيتزا مارغريتا', 'صلصة طماطم وموزاريلا – وسط', 35, 'بيتزا'],
      ['بيتزا خضار', 'فلفل، زيتون، فطر، بصل – وسط', 40, 'بيتزا'],
      ['بيتزا دجاج باربكيو', 'دجاج، صوص باربكيو، بصل أحمر – وسط', 50, 'بيتزا'],
      ['بيتزا سجق', 'سجق بلدي مع موزاريلا – وسط', 50, 'بيتزا'],
      ['بيتزا عائلية مشكلة', 'حجم كبير، نصف خضار ونصف دجاج', 75, 'بيتزا'],
      ['خبز بالثوم والجبنة', '6 قطع', 15, 'مقبلات'],
      ['مشروب غازي', 'لتر', 10, 'مشروبات'],
    ],
  },
  {
    owner: { name: 'رامي عيسى', email: 'sweets@tawseel.test' },
    name: 'كنافة باب الدار',
    description: 'كنافة نابلسية وحلويات شرقية على أصولها',
    category: 'حلويات',
    address: 'غزة – الشجاعية',
    phone: '0599000004',
    menu: [
      ['كنافة نابلسية ناعمة', 'صحن وسط', 15, 'كنافة'],
      ['كنافة خشنة', 'صحن وسط', 15, 'كنافة'],
      ['كنافة نوتيلا', 'صحن وسط', 15, 'كنافة'],
      ['بقلاوة مشكلة', 'نصف كيلو', 45, 'حلويات شرقية'],
      ['هريسة بالقشطة', 'صينية صغيرة', 30, 'حلويات شرقية'],
      ['قطايف بالجوز', '6 حبات', 20, 'حلويات شرقية'],
    ],
  },
  {
    owner: { name: 'إياد الشوا', email: 'falafel@tawseel.test' },
    name: 'فلافل الجرن',
    description: 'فلافل وحمص وفول على طريقة فطور أهل غزة',
    category: 'فلافل',
    address: 'غزة – مخيم الشاطئ',
    phone: '0599000005',
    menu: [
      ['ساندويش فلافل', 'خبز عربي، طحينة، سلطة', 6, 'سندويشات'],
      ['ساندويش فلافل بالبيض', 'فلافل مع بيض مسلوق وبطاطا', 10, 'سندويشات'],
      ['صحن حمص', 'مع زيت زيتون وخبز', 12, 'صحون'],
      ['صحن فول', 'فول مدمس بالليمون والزيت', 12, 'صحون'],
      ['فتة حمص', 'خبز محمص، حمص، لبن وصنوبر', 18, 'صحون'],
      ['فطور عيلة', 'فلافل، حمص، فول، مخلل وخبز لـ4 أشخاص', 50, 'وجبات'],
    ],
  },
  {
    owner: { name: 'محمود سالم', email: 'grill@tawseel.test' },
    name: 'مشاوي النخلة',
    description: 'مشاوي على الفحم: كباب وشيش طاووق وريش',
    category: 'مشاوي',
    address: 'دير البلح – شارع صلاح الدين',
    phone: '0599000006',
    menu: [
      ['ساندويش شيش طاووق', 'مع ثومية ومخلل', 18, 'سندويشات'],
      ['ساندويش كباب', 'كباب لحم مع طحينة وبقدونس', 22, 'سندويشات'],
      ['صحن شيش طاووق', 'سيخين مع بطاطا وخبز وسلطة', 50, 'صحون'],
      ['صحن كباب', 'سيخين كباب مع خبز وسلطة', 60, 'صحون'],
      ['مشاوي مشكلة', 'كيلو مشكل كباب وطاووق لـ3 أشخاص', 150, 'صحون'],
      ['سلطة عربية', 'صحن', 8, 'إضافات'],
    ],
  },
  {
    owner: { name: 'أنور بكر', email: 'fish@tawseel.test' },
    name: 'أسماك المرفأ',
    description: 'سمك بحر غزة مقلي ومشوي وصيادية',
    category: 'مأكولات بحرية',
    address: 'غزة – شارع الرشيد، الشيخ عجلين',
    phone: '0599000007',
    menu: [
      ['سمك مقلي', 'نصف كيلو مع سلطة دقة وخبز', 60, 'أسماك'],
      ['سمك مشوي', 'نصف كيلو بالفرن مع خضار', 65, 'أسماك'],
      ['صيادية سمك', 'أرز بالبصل المكرمل مع قطع سمك', 55, 'أطباق'],
      ['زبدية جمبري', 'جمبري بالطماطم والفلفل الحار في الفخار', 70, 'أطباق'],
      ['سلطة دقة غزاوية', 'طماطم، فلفل حار، ثوم، شبت', 10, 'إضافات'],
    ],
  },
  {
    owner: { name: 'أم محمد أبو عودة', email: 'kitchen@tawseel.test' },
    name: 'مطبخ ستي',
    description: 'أكلات غزاوية بيتية: سماقية ومفتول وفتة',
    category: 'مأكولات شعبية',
    address: 'خانيونس – البلد',
    phone: '0599000008',
    menu: [
      ['سماقية', 'صحن مع خبز ورقاق', 30, 'أطباق اليوم'],
      ['مفتول بالدجاج', 'مفتول مع مرق الحمص وربع دجاجة', 40, 'أطباق اليوم'],
      ['مقلوبة', 'أرز بالباذنجان والقرنبيط مع دجاج', 40, 'أطباق اليوم'],
      ['فتة غزاوية', 'خبز، أرز، لحم ومرق بالثوم', 50, 'أطباق اليوم'],
      ['رمانية', 'عدس وباذنجان بدبس الرمان', 25, 'أطباق اليوم'],
      ['لبن', 'علبة', 5, 'إضافات'],
    ],
  },
  {
    owner: { name: 'نضال قنديل', email: 'bakery@tawseel.test' },
    name: 'فطائر الطابون',
    description: 'مناقيش وفطائر طازة من فرن الطابون',
    category: 'فطائر',
    address: 'النصيرات – السوق',
    phone: '0599000009',
    menu: [
      ['منقوشة زعتر', 'زعتر بلدي وزيت زيتون', 5, 'مناقيش'],
      ['منقوشة جبنة', 'جبنة عكاوي', 10, 'مناقيش'],
      ['منقوشة جبنة وزعتر', 'نص ونص', 8, 'مناقيش'],
      ['فطيرة سبانخ', 'حبة', 4, 'فطائر'],
      ['فطيرة لحمة', 'لحم مفروم مع بصل وصنوبر', 12, 'فطائر'],
      ['مسخن رول', '4 قطع دجاج وبصل وسماق', 25, 'فطائر'],
    ],
  },
  {
    owner: { name: 'هبة الريس', email: 'cafe@tawseel.test' },
    name: 'مقهى الموج',
    description: 'قهوة وعصائر طازة وحلويات خفيفة',
    category: 'مشروبات',
    address: 'غزة – الرمال الجنوبي',
    phone: '0599000010',
    menu: [
      ['قهوة عربية', 'فنجان', 8, 'مشروبات ساخنة'],
      ['كابتشينو', 'كاسة وسط', 15, 'مشروبات ساخنة'],
      ['شاي بالنعنع', 'إبريق صغير', 8, 'مشروبات ساخنة'],
      ['عصير برتقال طازة', 'كاسة كبيرة', 15, 'عصائر'],
      ['كوكتيل فواكه', 'بالقشطة والعسل', 20, 'عصائر'],
      ['كيكة شوكولاتة', 'قطعة', 15, 'حلويات'],
    ],
  },
]

async function shouldSeed() {
  if (!process.argv.includes('--on-deploy')) return true

  if (process.env.SEED_DEMO_DATA === 'reset') {
    console.log('[seed] SEED_DEMO_DATA=reset → resetting the database to the demo data')
    return true
  }
  const count = await prisma.restaurant.count()
  if (count === 0) {
    console.log('[seed] Empty database → adding the demo data')
    return true
  }
  console.log(`[seed] Database already has ${count} restaurants → skipping demo data`)
  return false
}

async function main() {
  if (!(await shouldSeed())) return

  const passwordHash = await bcrypt.hash('password123', 10)
  const emailVerifiedAt = new Date() // demo accounts are already verified

  // Empty all tables and restart IDs at 1, so restaurant links stay the same after every seed.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE order_items, orders, menu_items, restaurants, users RESTART IDENTITY CASCADE',
  )

  await prisma.user.create({
    data: { name: 'سارة أحمد', email: 'customer@tawseel.test', phone: '0599111111', passwordHash, emailVerifiedAt },
  })

  for (const r of restaurants) {
    await prisma.user.create({
      data: {
        ...r.owner,
        passwordHash,
        emailVerifiedAt,
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

  // Demo admin for local development only. On Railway the admin comes from ADMIN_EMAIL / ADMIN_PASSWORD.
  if (process.env.NODE_ENV !== 'production') {
    await prisma.user.create({ data: { name: 'مدير الموقع', email: 'admin@tawseel.test', role: 'ADMIN', passwordHash, emailVerifiedAt } })
  }

  console.log(`Seeded ${restaurants.length} restaurants. Login with customer@tawseel.test / password123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
