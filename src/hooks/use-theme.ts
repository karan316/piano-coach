import { useState, useEffect, useCallback } from 'react'
import { type Theme, getInitialTheme, applyTheme, onSystemThemeChange } from '#/lib/theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const initial = getInitialTheme()
    setThemeState(initial)
    applyTheme(initial)

    const cleanup = onSystemThemeChange((t) => {
      setThemeState(t)
      applyTheme(t)
    })

    return cleanup
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    applyTheme(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}
