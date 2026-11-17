#!/usr/bin/env node
// Download React Bits components (https://reactbits.dev) from their public registry on GitHub.
// Usage: npm run reactbits -- SplitText-JS-TW Aurora-JS-TW
// Names follow the React Bits registry: <Component>-<JS|TS>-<CSS|TW>
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const REGISTRY = 'https://raw.githubusercontent.com/DavidHDev/react-bits/main/public/r'
const OUT_DIR = path.resolve('src/components/react-bits')

const names = process.argv.slice(2)
if (names.length === 0) {
  console.error('Usage: npm run reactbits -- <Name-JS-TW> [...]')
  process.exit(1)
}

const deps = new Set()
for (const name of names) {
  const res = await fetch(`${REGISTRY}/${name}.json`)
  if (!res.ok) {
    console.error(`✗ ${name}: HTTP ${res.status}`)
    process.exitCode = 1
    continue
  }
  const item = await res.json()
  for (const file of item.files ?? []) {
    const target = path.join(OUT_DIR, file.path)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, file.content)
    console.log(`✓ ${path.relative(process.cwd(), target)}`)
  }
  for (const d of item.dependencies ?? []) deps.add(d)
}

if (deps.size) console.log(`\nRequired packages: ${[...deps].join(' ')}\nInstall any missing with: npm i ${[...deps].join(' ')}`)
