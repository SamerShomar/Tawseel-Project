import { useSyncExternalStore } from 'react'

// Light or dark. The visitor's choice is saved on the device; without one, the site follows the device setting.
// index.html applies the theme before the first paint, so there is no flash of the wrong colors.
const KEY = 'theme'
const system = window.matchMedia?.('(prefers-color-scheme: dark)')
const listeners = new Set()
let unsaved = null // the choice when storage is blocked (private mode): it lasts until the page is closed

function saved() {
  try {
    return localStorage.getItem(KEY) ?? unsaved
  } catch {
    return unsaved
  }
}

function current() {
  const choice = saved()
  return choice === 'dark' || choice === 'light' ? choice : system?.matches ? 'dark' : 'light'
}

function apply() {
  const theme = current()
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0b0c' : '#ffffff')
  listeners.forEach((fn) => fn())
}

system?.addEventListener('change', apply)
apply()

export function setTheme(theme) {
  unsaved = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Storage blocked: keep the in-memory choice.
  }
  apply()
}

/** The active theme ('light' or 'dark'), and a function that switches to the other one. */
export function useTheme() {
  const theme = useSyncExternalStore((fn) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, current)
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')]
}
