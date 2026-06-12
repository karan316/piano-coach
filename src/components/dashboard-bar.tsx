import { Flame, Target, Clock, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DashboardBarProps {
  streak: number
  accuracy: number
  lastReactionMs: number
  sessionStartTime: number
  totalAttempts: number
}

export function DashboardBar({ streak, accuracy, lastReactionMs, sessionStartTime, totalAttempts }: DashboardBarProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!sessionStartTime) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStartTime])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl bg-gray-50 px-4 py-2 text-sm dark:bg-[#1A1525]/60 sm:gap-5">
      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <Flame size={16} className={streak > 0 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'} />
        <span className="font-semibold text-gray-700 dark:text-gray-300">{streak}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">streak</span>
      </div>

      {/* Accuracy */}
      <div className="flex items-center gap-1.5">
        <Target size={16} className="text-blue-500" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          {totalAttempts > 0 ? `${Math.round(accuracy * 100)}%` : '—'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">accuracy</span>
      </div>

      {/* Reaction Time */}
      <div className="flex items-center gap-1.5">
        <Clock size={16} className="text-emerald-500" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          {lastReactionMs > 0 ? `${(lastReactionMs / 1000).toFixed(1)}s` : '—'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">reaction</span>
      </div>

      {/* Session timer */}
      <div className="flex items-center gap-1.5">
        <Timer size={16} className="text-purple-500" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
