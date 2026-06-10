import { ArrowLeft, Trash2 } from 'lucide-react'
import { usePracticeLog } from '#/hooks/use-practice-log'
import { formatNoteDisplay } from '#/lib/notes'

interface StatsPanelProps {
  onBack: () => void
}

export function StatsPanel({ onBack }: StatsPanelProps) {
  const { stats, isLoading, getLog, clearLog } = usePracticeLog()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400 dark:text-gray-500">Loading practice data…</p>
      </div>
    )
  }

  const log = getLog()
  const hasData = log.length > 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Practice Stats</h1>
        {hasData && (
          <button
            onClick={() => { if (confirm('Clear all practice history?')) void clearLog() }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {!hasData ? (
        <div className="py-16 text-center">
          <p className="text-4xl">🎵</p>
          <p className="mt-4 text-gray-500 dark:text-gray-400">No practice data yet!</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Start an exercise to track your progress.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Notes" value={stats?.totalAttempts.toString() ?? '0'} />
            <StatCard label="Accuracy" value={stats ? `${Math.round(stats.accuracy * 100)}%` : '—'} />
            <StatCard label="Avg Reaction" value={stats ? `${(stats.avgReactionMs / 1000).toFixed(1)}s` : '—'} />
            <StatCard label="Best Streak" value={stats?.bestStreak.toString() ?? '0'} />
          </div>

          {/* Per-note accuracy breakdown */}
          {stats && stats.byNote.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Note Accuracy</h3>
              <div className="space-y-2">
                {stats.byNote
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .map((noteStat) => (
                    <div key={noteStat.note} className="flex items-center gap-3">
                      <span className="w-10 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatNoteDisplay(noteStat.note)}
                      </span>
                      <div className="flex-1">
                        <div className="h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              noteStat.accuracy >= 0.8
                                ? 'bg-emerald-400'
                                : noteStat.accuracy >= 0.5
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.round(noteStat.accuracy * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(noteStat.accuracy * 100)}%
                      </span>
                      <span className="w-16 text-right text-xs text-gray-400 dark:text-gray-500">
                        {(noteStat.avgReactionMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Weak notes */}
          {stats && stats.weakNotes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <h3 className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                💪 Focus Areas
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                These notes need more practice (slow reaction or low accuracy):
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.weakNotes.map((note) => (
                  <span
                    key={note}
                    className="rounded-md bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-700 dark:bg-amber-800/50 dark:text-amber-300"
                  >
                    {formatNoteDisplay(note)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-exercise breakdown */}
          {stats && Object.keys(stats.byExercise).length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-300">By Exercise</h3>
              <div className="space-y-2">
                {Object.entries(stats.byExercise).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
                    <span className="text-sm font-medium text-gray-700 capitalize dark:text-gray-300">
                      {id.replace(/-/g, ' ')}
                    </span>
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{data.attempts} attempts</span>
                      <span>{Math.round(data.accuracy * 100)}% accuracy</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-800/60">
      <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</div>
      <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{label}</div>
    </div>
  )
}
