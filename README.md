# Tawseel – Online Food Delivery Web App

Team **ORBA** — Software Engineering team project.

Tawseel connects customers with local restaurants: browse menus, order with cash on delivery, and track the order until it arrives. Restaurant owners manage their menu and incoming orders from a dashboard.

## Features (MVP)

1. **User accounts**: sign up as a customer or restaurant owner, log in and out, and reset a forgotten password by email
2. **Browse restaurants and menus**, with search and category filter
3. **Cart and checkout**: change quantities, enter delivery details, pay cash on delivery
4. **Order tracking and history**: the status updates automatically
5. **Restaurant orders dashboard**: accept or reject an order, then update its status step by step
6. **Menu management**: add, edit and delete items, and mark items available or unavailable

Also: an **admin panel** (`/admin`) with site statistics, and the admin can suspend users, hide restaurants and view all orders.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend (`client/`) | React (JavaScript) + Vite, React Router, Tailwind CSS, GSAP, Lenis, React Bits |
| Backend (`server/`) | Node.js + Express, REST API (JSON), JWT + bcrypt, Nodemailer, zod |
| Database | PostgreSQL + Prisma |
| Testing | Jest + Supertest (API), Vitest + React Testing Library (UI) |
| CI | GitHub Actions: tests and build on every pull request |

## Getting started

You need **Node.js 22+** and **PostgreSQL 16+**.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then edit DATABASE_URL if needed
npx prisma migrate dev      # creates the tables
npm run db:seed             # demo restaurants and accounts
npm run dev                 # http://localhost:4000
```

### 2. Frontend (in a second terminal)

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

### Demo accounts

All demo accounts use the password `password123`.

| Role | Email |
|---|---|
| Admin (local only) | `admin@tawseel.test` |
| Customer | `customer@tawseel.test` |
| Restaurant owners | `shawarma@`, `burger@`, `pizza@`, `sweets@`, `falafel@`, `grill@`, `fish@`, `kitchen@`, `bakery@`, `cafe@` + `tawseel.test` |

The seed adds 10 restaurants in real areas of the Gaza Strip (Rimal, Shati camp, Shujaiya, Nuseirat, Deir al-Balah, Khan Younis…). Restaurant and owner names are made up for the demo, and the shekel prices are based on real 2026 price levels in Gaza.

In development, "Forgot password" prints the reset link in the **server console**. To send real emails, set `BREVO_API_KEY` and `MAIL_FROM` (see the email section of [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)).

## Deployment

The database is on **Supabase**. **Railway** runs one service that builds the React app and serves it from the Express server, so the site and the API share one URL (`railway.json`, root `package.json`). Step-by-step guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Tests

```bash
cd server && npm test             # needs a database called tawseel_test (see server/tests/env.js)
cd server && npm run test:coverage
cd client && npm test
```

Before the first server test run, create the test database:

```bash
createdb tawseel_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tawseel_test npx prisma migrate deploy
```

## Repository structure

```
client/                 React app
  src/pages/            one file per screen (owner/ = restaurant dashboard, auth/ = login etc.)
  src/components/       shared components (react-bits/ = React Bits animations)
  src/context/          AuthContext (logged-in user), CartContext (cart)
  src/lib/api.js        fetch wrapper for the API
server/                 Express API
  prisma/schema.prisma  database tables
  src/routes/           one file per resource
  src/middleware/       auth (JWT + roles), validation, errors
  tests/                Jest + Supertest
docs/                   proposal, API docs (API.md), deployment guide (DEPLOYMENT.md)
railway.json            Railway build / deploy config
package.json            root scripts used by Railway (build client, start server)
```

## Workflow

One branch per feature, and a pull request reviewed by another member before merging to `main`. CI must pass.
