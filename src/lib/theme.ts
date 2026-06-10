// Theme management: system preference auto-detect + manual toggle with localStorage

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'piano-coach-theme'

/** Get the initial theme: localStorage override > system preference > light */
export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

/** Apply theme class to document and persist to localStorage */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
}

/** Listen for system theme changes (returns cleanup function) */
export function onSystemThemeChange(callback: (theme: Theme) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent) => {
    // Only auto-switch if user hasn't manually set a preference
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      callback(e.matches ? 'dark' : 'light')
    }
  }
  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}
