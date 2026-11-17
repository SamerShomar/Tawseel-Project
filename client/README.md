# Tawseel – Frontend

React (JavaScript) + Vite + Tailwind CSS v4. The UI is in Arabic (RTL).

- **Routing**: React Router (`src/App.jsx`)
- **API calls**: `src/lib/api.js`. In development Vite proxies `/api` to `http://localhost:4000`. In production the Express server serves the built app, so the API is on the same URL. Set `VITE_API_URL` only when the API runs on a different address.
- **GSAP**: plugins are registered in `src/lib/gsap.js`. Use `useGSAP` for animations.
- **Lenis**: smooth scrolling is turned on in `Layout` through `useLenis()`, and stays synced with ScrollTrigger.
- **React Bits**: components live in `src/components/react-bits/`.

## Commands

```bash
npm run dev       # development server
npm run build     # production build in dist/
npm run lint
npm test
```

## Adding React Bits components

Names follow `<Component>-<JS|TS>-<TW|CSS>`. Use `JS-TW` for this project:

```bash
npm run reactbits -- BlurText-JS-TW
```

The official CLI also works where reactbits.dev is reachable:

```bash
npx shadcn@latest add @react-bits/BlurText-JS-TW
```
