# Tawseel

React 19 + Vite + TypeScript + Tailwind CSS v4, with:

- **GSAP** (`gsap`, `@gsap/react`) — plugins registered in `src/lib/gsap.ts` (ScrollTrigger, SplitText)
- **Lenis** — smooth scroll via `useLenis()` in `src/hooks/useLenis.ts`, synced with ScrollTrigger
- **React Bits** — components live in `src/components/react-bits/`

## Commands

```bash
npm install
npm run dev
npm run build
```

## Adding React Bits components

Names follow `<Component>-<TS|JS>-<TW|CSS>` (e.g. `Aurora-TS-TW`):

```bash
npm run reactbits -- Aurora-TS-TW BlurText-TS-TW
```

The official CLI also works where reactbits.dev is reachable:

```bash
npx shadcn@latest add @react-bits/Aurora-TS-TW
```
