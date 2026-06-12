import { useState, useEffect } from 'react'
import { noteNameToMidi, formatNoteDisplay } from '#/lib/notes'
import { StaffDisplay } from './staff-display'
import { Eye } from 'lucide-react'

interface StaffPromptProps {
  note: string // e.g. "E" — note letter without octave
  noteWithOctave: string // e.g. "E4"
  phase: 'prompting' | 'correct' | 'incorrect' | 'idle'
  showNoteName?: boolean
}

export function StaffPrompt({ note, noteWithOctave, phase, showNoteName = true }: StaffPromptProps) {
  if (!noteWithOctave) return null
  const midi = noteNameToMidi(noteWithOctave)
  const [hintRevealed, setHintRevealed] = useState(false)

  // Reset hint when a new note is prompted
  useEffect(() => {
    setHintRevealed(false)
  }, [noteWithOctave])

  const shouldShowName = showNoteName || hintRevealed

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
        Play this note
      </p>

      {/* Staff with note */}
      <div
        className={`transition-colors ${
          phase === 'correct'
            ? 'text-emerald-500'
            : phase === 'incorrect'
              ? 'text-red-400'
              : 'text-gray-700 dark:text-gray-200'
        }`}
      >
        <StaffDisplay notes={[midi]} width={200} height={130} showLabels={shouldShowName} />
      </div>

      {/* Note name below (always shown for non-staff-reader, or when hint is revealed) */}
      {shouldShowName ? (
        <div
          className={`font-display text-4xl transition-colors ${
            phase === 'correct'
              ? 'text-emerald-500'
              : phase === 'incorrect'
                ? 'text-red-400'
                : hintRevealed
                  ? 'text-violet-500 dark:text-violet-400'
                  : 'text-gray-800 dark:text-gray-100'
          }`}
        >
          {formatNoteDisplay(note)}
        </div>
      ) : (
        <button
          onClick={() => setHintRevealed(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:bg-[#1A1525] dark:text-gray-400 dark:hover:bg-violet-900/20 dark:hover:text-violet-400"
        >
          <Eye size={14} />
          Show hint
        </button>
      )}

      {phase === 'incorrect' && (
        <p className="text-sm text-red-400">Not quite — try again!</p>
      )}
      {phase === 'correct' && (
        <p className="text-sm text-emerald-500">Perfect! ✓</p>
      )}
    </div>
  )
}
