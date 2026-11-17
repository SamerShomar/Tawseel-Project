# Tawseel REST API

Base URL: `/api` (default `http://localhost:4000/api`). All bodies are JSON.

Protected routes need the header `Authorization: Bearer <token>`. The token comes from `register` or `login`.

Errors look like `{ "error": "message" }`. Validation errors (400) also include
`"details": [{ "field": "email", "message": "..." }]`.

## Auth

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | – | `name, email, password, phone?, role?, restaurantName?` | `role` is `CUSTOMER` (default) or `RESTAURANT_OWNER`. Owners must send `restaurantName`; their restaurant is created automatically. Returns `{ token, user }`. |
| POST | `/auth/login` | – | `email, password` | Returns `{ token, user }`. |
| GET | `/auth/me` | any | – | Returns `{ user }`. |
| POST | `/auth/forgot-password` | – | `email` | Emails a reset link (valid 30 min). Same answer whether the email exists or not. |
| POST | `/auth/reset-password` | – | `token, password` | The token from the email link. Each token works once. |

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
| PATCH | `/my-restaurant/orders/:id/status` | `status`: only the next step is allowed (see above). |
