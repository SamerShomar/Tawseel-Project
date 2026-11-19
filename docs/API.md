# Tawseel REST API

Base URL: `/api` (default `http://localhost:4000/api`). All bodies are JSON.

Protected routes need the header `Authorization: Bearer <token>`. The token comes from `register` or `login`.

Errors look like `{ "error": "message" }`. Validation errors (400) also include
`"details": [{ "field": "email", "message": "..." }]`.

## Auth

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | – | `name, email, password, phone?, role?, restaurantName?` | `role` is `CUSTOMER` (default) or `RESTAURANT_OWNER` (an admin can't be registered). Owners must send `restaurantName`; their restaurant is created automatically. Returns `{ token, user }`. |
| POST | `/auth/login` | – | `email, password` | Returns `{ token, user }`. |
| GET | `/auth/me` | any | – | Returns `{ user }`. |
| POST | `/auth/forgot-password` | – | `email` | Emails a reset link (valid 30 min). Same answer whether the email exists or not. |
| POST | `/auth/reset-password` | – | `token, password` | The token from the email link. Each token works once. |
| POST | `/auth/verify-email` | – | `token` | The token from the verification email sent at registration (valid 24 h, works once). Returns `{ message, user }`. An expired token returns `expired: true`. |
| POST | `/auth/resend-verification` | any | – | Sends a new verification link. 400 if the email is already verified. |

`user` objects include `emailVerified`. Until it is `true`, a customer can't place orders (403, `code: "EMAIL_NOT_VERIFIED"`), and a restaurant owner's restaurant is hidden from customers. Accounts that existed before email verification was added are treated as verified.

Logout happens on the client (it deletes the token).

## Restaurants (public)

| Method | Path | Notes |
|---|---|---|
| GET | `/restaurants?search=&category=` | List restaurants. `search` matches the name. |
| GET | `/restaurants/categories` | List of categories in use. |
| GET | `/restaurants/:id` | Restaurant with its **available** `menuItems`. |

## Orders (customer)

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/orders` | CUSTOMER | `restaurantId, items: [{ menuItemId, quantity }], deliveryAddress, phone, notes?`. Prices and the total are calculated on the server. Payment is cash on delivery. |
| GET | `/orders` | CUSTOMER | The customer's orders, newest first. |
| GET | `/orders/:id` | CUSTOMER or owner | Only the customer who placed it or the owner of the restaurant can see it. |

Order status: `PENDING → ACCEPTED → PREPARING → ON_THE_WAY → DELIVERED`, or `PENDING → REJECTED`.
The **restaurant** accepts or rejects the order and starts preparing it. The **driver** picks it up (`ON_THE_WAY`) and delivers it.

## Admin

All routes need an `ADMIN` token. Admin accounts can't be created through `/auth/register`. They come from the `ADMIN_EMAIL` / `ADMIN_PASSWORD` variables (see `server/prisma/ensure-admin.js`).

| Method | Path | Body / Notes |
|---|---|---|
| GET | `/admin/stats` | Users by role, restaurants (total / active), orders (total / today / by status), delivered revenue, latest 5 orders. |
| GET | `/admin/users?search=&role=` | All users. `search` matches the name or email. |
| PATCH | `/admin/users/:id` | `{ isActive?, driverApproved? }`. A suspended user can't log in, and their existing tokens stop working (403). `driverApproved` approves or un-approves a driver. Admins can't be changed here. |
| GET | `/admin/restaurants` | All restaurants with their owner, item count and order count. |
| PATCH | `/admin/restaurants/:id` | `{ isActive }`. A hidden restaurant disappears from `/restaurants` and can't receive orders. |
| GET | `/admin/orders?status=&restaurantId=` | Latest 200 orders, newest first. |

Admins can also open any order with `GET /orders/:id`.

## Driver

All routes need a `DRIVER` token, a verified email, and **admin approval** (403 with `code: "DRIVER_NOT_APPROVED"` until then). Drivers register through `/auth/register` with `role: "DRIVER"` and a `phone`.

| Method | Path | Body / Notes |
|---|---|---|
| GET | `/driver/available` | Orders waiting for a driver: accepted or being prepared, with no driver yet. Oldest first. |
| GET | `/driver/mine` | `{ active, delivered, deliveredCount }`: my current deliveries, and my last 30 delivered orders. |
| POST | `/driver/orders/:id/claim` | Take the order. 409 if another driver took it first (atomic). |
| POST | `/driver/orders/:id/release` | Give it back before pickup. |
| PATCH | `/driver/orders/:id/status` | `status`: `ON_THE_WAY` (picked up from the restaurant), then `DELIVERED`. |

The customer, the restaurant and admins see `order.driver` (`name`, `phone`) once a driver takes the order.

## My restaurant (restaurant owner)

All routes need a `RESTAURANT_OWNER` token and act on the owner's own restaurant.

| Method | Path | Body / Notes |
|---|---|---|
| GET | `/my-restaurant` | Restaurant info. |
| PATCH | `/my-restaurant` | Any of `name, description, category, address, phone, imageUrl`. |
| GET | `/my-restaurant/menu` | All menu items (including unavailable ones). |
| POST | `/my-restaurant/menu` | `name, price, description?, category?, imageUrl?, isAvailable?` |
| PATCH | `/my-restaurant/menu/:id` | Any menu item field. |
| DELETE | `/my-restaurant/menu/:id` | Old orders keep the item's name and price. |
| GET | `/my-restaurant/orders?status=` | Incoming orders, newest first. |
| PATCH | `/my-restaurant/orders/:id/status` | `status`: `ACCEPTED` or `REJECTED` (from `PENDING`), then `PREPARING`. Pickup and delivery are the driver's steps. |
