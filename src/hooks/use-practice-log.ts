import { useState, useEffect, useCallback, useRef } from 'react'
import { practiceStore, type PracticeEntry, type PracticeStats } from '#/lib/practice-store'

export function usePracticeLog() {
  const [stats, setStats] = useState<PracticeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    void practiceStore.load().then(() => {
      setStats(practiceStore.getStats())
      setIsLoading(false)
    })
  }, [])

  const appendEntry = useCallback(async (entry: Omit<PracticeEntry, 'timestamp'>) => {
    const fullEntry: PracticeEntry = { ...entry, timestamp: Date.now() }
    await practiceStore.appendEntry(fullEntry)
    setStats(practiceStore.getStats())
  }, [])

  const getRecentEntries = useCallback((exerciseId: string, count?: number) => {
    return practiceStore.getRecentEntries(exerciseId, count)
  }, [])

  const getLog = useCallback(() => {
    return practiceStore.getLog()
  }, [])

  const clearLog = useCallback(async () => {
    await practiceStore.clear()
    setStats(practiceStore.getStats())
  }, [])

  return { stats, isLoading, appendEntry, getRecentEntries, getLog, clearLog }
}
