// Prisma returns Decimal objects for prices; the API sends plain numbers.
const toNumber = (d) => (d == null ? d : Number(d))

export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone })

export const menuItemDto = (m) => ({ ...m, price: toNumber(m.price) })

export const orderDto = (o) => ({
  ...o,
  total: toNumber(o.total),
  items: o.items?.map((i) => ({ ...i, unitPrice: toNumber(i.unitPrice) })),
})
