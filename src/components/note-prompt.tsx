import { formatNoteDisplay } from '#/lib/notes'

interface NotePromptProps {
  note: string // e.g. "E" or "F#"
  phase: 'prompting' | 'correct' | 'incorrect' | 'idle'
}

export function NotePrompt({ note, phase }: NotePromptProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
        Find this note
      </p>
      <div
        className={`animate-note-appear font-display text-7xl transition-colors sm:text-8xl ${
          phase === 'correct'
            ? 'text-emerald-500'
            : phase === 'incorrect'
              ? 'text-red-400'
              : 'text-gray-800 dark:text-gray-100'
        }`}
      >
        {formatNoteDisplay(note)}
      </div>
      {phase === 'incorrect' && (
        <p className="animate-note-appear text-sm text-red-400">Try again, keep looking!</p>
      )}
      {phase === 'correct' && (
        <p className="animate-note-appear text-sm text-emerald-500">Correct! ✓</p>
      )}
    </div>
  )
}
