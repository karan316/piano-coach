import { formatNoteDisplay } from '#/lib/notes'
import type { IntervalPrompt as IntervalPromptType } from '#/lib/game-logic'

interface IntervalPromptProps {
  prompt: IntervalPromptType | null
  currentStep: number // 0 = first note, 1 = second note
  phase: 'prompting' | 'correct' | 'incorrect' | 'idle'
}

export function IntervalPrompt({ prompt, currentStep, phase }: IntervalPromptProps) {
  if (!prompt) return null

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
        Play these notes in order
      </p>

      <div className="flex items-center gap-6">
        {/* First note */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl font-display text-3xl transition-all sm:h-24 sm:w-24 sm:text-4xl ${
              currentStep === 0
                ? phase === 'incorrect'
                  ? 'bg-red-50 text-red-500 ring-2 ring-red-300 dark:bg-red-900/20'
                  : 'bg-blue-50 text-blue-600 ring-2 ring-blue-300 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-emerald-50 text-emerald-500 ring-2 ring-emerald-300 dark:bg-emerald-900/20'
            }`}
          >
            {formatNoteDisplay(prompt.note1)}
          </div>
          <div className={`h-2.5 w-2.5 rounded-full ${currentStep >= 1 ? 'bg-emerald-500' : 'bg-blue-400 animate-pulse'}`} />
        </div>

        {/* Arrow */}
        <div className="text-2xl text-gray-300 dark:text-gray-600">→</div>

        {/* Second note */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl font-display text-3xl transition-all sm:h-24 sm:w-24 sm:text-4xl ${
              currentStep === 1
                ? phase === 'correct'
                  ? 'bg-emerald-50 text-emerald-500 ring-2 ring-emerald-300 dark:bg-emerald-900/20'
                  : phase === 'incorrect'
                    ? 'bg-red-50 text-red-500 ring-2 ring-red-300 dark:bg-red-900/20'
                    : 'bg-blue-50 text-blue-600 ring-2 ring-blue-300 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            {formatNoteDisplay(prompt.note2)}
          </div>
          <div className={`h-2.5 w-2.5 rounded-full ${
            currentStep === 1 && phase === 'correct'
              ? 'bg-emerald-500'
              : currentStep === 1
                ? 'bg-blue-400 animate-pulse'
                : 'bg-gray-300 dark:bg-gray-600'
          }`} />
        </div>
      </div>

      {/* Interval name shown after completion */}
      {phase === 'correct' && (
        <div className="animate-note-appear text-center">
          <p className="font-display text-lg text-emerald-500">
            That's a {prompt.intervalName}! ✓
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {prompt.semitones} semitone{prompt.semitones !== 1 ? 's' : ''} apart
          </p>
        </div>
      )}

      {phase === 'incorrect' && (
        <p className="text-sm text-red-400">Wrong note — try again!</p>
      )}
    </div>
  )
}
