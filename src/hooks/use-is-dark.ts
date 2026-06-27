import { useEffect, useState } from 'react'

/**
 * Reactively tracks whether the app is in dark mode by observing the `dark`
 * class on <html>. Unlike a fresh useTheme() instance, this reflects changes
 * made by any component (e.g. the header theme toggle).
 */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const el = document.documentElement
    const update = () => setIsDark(el.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}
