import { formatNoteDisplay } from '#/lib/notes'
import type { ScaleInfo } from '#/lib/game-logic'

interface ScalePromptProps {
  notes: string[] // e.g. ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]
  scaleInfo: ScaleInfo | null
  currentStep: number
  phase: 'prompting' | 'correct' | 'incorrect' | 'idle'
}

export function ScalePrompt({ notes, scaleInfo, currentStep, phase }: ScalePromptProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scale name */}
      {scaleInfo && (
        <p className="font-display text-2xl text-foreground sm:text-3xl">
          {scaleInfo.name}
        </p>
      )}

      <p className="text-sm font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
        Play each note in order
      </p>

      {/* Notes to play */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {notes.map((note, i) => (
          <div
            key={i}
            className={`flex h-12 w-12 items-center justify-center rounded-xl font-display text-lg transition-all sm:h-14 sm:w-14 sm:text-xl ${
              i < currentStep
                ? 'bg-emerald-50 text-emerald-500 ring-2 ring-emerald-300 dark:bg-emerald-900/20'
                : i === currentStep && phase !== 'correct'
                  ? 'bg-violet-50 text-violet-600 ring-2 ring-violet-300 dark:bg-violet-900/20 dark:text-violet-400'
                  : i === currentStep && phase === 'correct'
                    ? 'bg-emerald-50 text-emerald-500 ring-2 ring-emerald-300 dark:bg-emerald-900/20'
                    : 'bg-gray-50 text-gray-400 ring-1 ring-gray-200 dark:bg-[#1A1525] dark:text-gray-500 dark:ring-gray-700'
            }`}
          >
            {formatNoteDisplay(note)}
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {notes.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < currentStep
                ? 'bg-emerald-500'
                : i === currentStep && phase !== 'correct'
                  ? 'bg-violet-400'
                  : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Celebration banner on correct */}
      {phase === 'correct' && scaleInfo && (
        <div className="animate-note-appear w-full max-w-md rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 text-center shadow-lg dark:border-emerald-800 dark:from-emerald-900/30 dark:to-teal-900/30">
          <div className="mb-2 text-3xl">🎉</div>
          <h3 className="font-display text-xl text-emerald-700 dark:text-emerald-300">
            {scaleInfo.name}!
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {scaleInfo.description}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {scaleInfo.notes.map((n, i) => (
              <span key={i} className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-mono text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300">
                {formatNoteDisplay(n)}
              </span>
            ))}
          </div>
        </div>
      )}

      {phase === 'incorrect' && (
        <p className="text-sm text-red-400">Wrong note — try again from the beginning!</p>
      )}
    </div>
  )
}
