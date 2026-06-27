import { useState } from 'react'
import { ArrowLeft, Music4 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { SONG_PIECES, type Difficulty, type Song } from '#/lib/songs'
import { SongPlayer } from './song-player'

interface SongLibraryProps {
  onBack: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

const DIFF_STYLE: Record<Difficulty, string> = {
  easy: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30',
  medium: 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30',
  hard: 'border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30',
}

export function SongLibrary({ onBack }: SongLibraryProps) {
  const [selected, setSelected] = useState<Song | null>(null)

  if (selected) {
    return <SongPlayer song={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="w-16" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-2 sm:px-6">
        <div className="mb-6 text-center">
          <h2 className="font-display text-3xl text-foreground">Songs</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Practice full songs with a falling-note piano roll or sheet music. Pick a
            difficulty to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SONG_PIECES.map((piece) => (
            <div
              key={piece.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-500 dark:from-violet-900/40 dark:to-purple-900/30 dark:text-violet-400">
                  <Music4 size={22} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg text-card-foreground">{piece.title}</h3>
                  <p className="text-xs text-muted-foreground">{piece.composer}</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{piece.blurb}</p>

              <div className="mt-auto flex gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelected(piece.variants[diff])}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${DIFF_STYLE[diff]}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
