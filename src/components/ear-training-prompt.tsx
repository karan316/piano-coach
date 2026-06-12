import { Volume2, RotateCcw } from 'lucide-react'
import { formatNoteDisplay, noteNameToMidi, midiToLetter } from '#/lib/notes'

interface EarTrainingPromptProps {
  noteWithOctave: string // e.g. "E4"
  phase: 'prompting' | 'correct' | 'incorrect' | 'idle'
  onPlaySound: () => void
  hasListened: boolean
}

export function EarTrainingPrompt({ noteWithOctave, phase, onPlaySound, hasListened }: EarTrainingPromptProps) {
  if (!noteWithOctave) return null
  const noteLetter = midiToLetter(noteNameToMidi(noteWithOctave))

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
        Listen and play
      </p>

      {/* Listen button */}
      <button
        onClick={onPlaySound}
        className="group flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:h-28 sm:w-28"
      >
        <Volume2 size={36} className="transition-transform group-hover:scale-110" />
      </button>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {hasListened ? 'Now play it on the piano!' : 'Tap to hear the note'}
      </p>

      {/* Replay hint */}
      {hasListened && phase === 'prompting' && (
        <button
          onClick={onPlaySound}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <RotateCcw size={12} />
          Listen again
        </button>
      )}

      {phase === 'correct' && (
        <div className="animate-note-appear text-center">
          <p className="font-display text-lg text-emerald-500">
            Correct! That was {formatNoteDisplay(noteLetter)} ✓
          </p>
        </div>
      )}

      {phase === 'incorrect' && (
        <div className="text-center">
          <p className="text-sm text-red-400">Not quite — listen again and try!</p>
          <button
            onClick={onPlaySound}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
          >
            <Volume2 size={12} />
            Replay
          </button>
        </div>
      )}
    </div>
  )
}
