import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useAudio } from '#/hooks/use-audio'
import { useIsDark } from '#/hooks/use-is-dark'
import { useSongPlayback } from '#/hooks/use-song-playback'
import { computeKeyLayout, layoutForNotes } from '#/lib/keyboard-layout'
import type { Song } from '#/lib/songs/types'
import { PianoKeyboard } from './piano-keyboard'
import { PianoRoll } from './song/piano-roll'
import { SheetMusic } from './song/sheet-music'
import { PlaybackControls, type ViewMode } from './song/playback-controls'
import { SongSettings } from './song/song-settings'

interface SongPlayerProps {
  song: Song
  onBack: () => void
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  hard: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
}

export function SongPlayer({ song, onBack }: SongPlayerProps) {
  const audio = useAudio()
  const isDark = useIsDark()
  const [mode, setMode] = useState<ViewMode>('roll')
  const [pointerNotes, setPointerNotes] = useState<Set<number>>(new Set())

  const playback = useSongPlayback({ song, audio })

  // Size the keyboard to comfortably hold the song's range
  const { startOctave, numOctaves } = useMemo(
    () => layoutForNotes(song.notes.map((n) => n.midi)),
    [song],
  )
  const layout = useMemo(
    () => computeKeyLayout(startOctave, numOctaves),
    [startOctave, numOctaves],
  )

  // Preload grand-piano samples for the song range
  useEffect(() => {
    if (audio.mode === 'grand') {
      void audio.preloadSamples(layout.startMidi, layout.endMidi)
    }
  }, [audio, layout.startMidi, layout.endMidi])

  const handleNoteOn = useCallback(
    (midi: number) => {
      audio.startNote(midi)
      setPointerNotes((prev) => {
        const next = new Set(prev)
        next.add(midi)
        return next
      })
    },
    [audio],
  )
  const handleNoteOff = useCallback(
    (midi: number) => {
      audio.releaseNote(midi)
      setPointerNotes((prev) => {
        const next = new Set(prev)
        next.delete(midi)
        return next
      })
    },
    [audio],
  )

  const activeNotes = useMemo(
    () => new Set<number>([...playback.activeMidis, ...pointerNotes]),
    [playback.activeMidis, pointerNotes],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg text-foreground">{song.title}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${DIFFICULTY_BADGE[song.difficulty]}`}
          >
            {song.difficulty}
          </span>
        </div>

        <SongSettings
          soundMode={audio.mode}
          onSoundModeChange={audio.setMode}
          dampDuration={audio.dampDuration}
          onDampDurationChange={audio.setDampDuration}
          outputEnabled={audio.outputEnabled}
          onOutputEnabledChange={audio.setOutputEnabled}
        />
      </div>

      {/* Main view */}
      <div className="flex min-h-0 flex-1 flex-col px-2 sm:px-4">
        {mode === 'roll' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <PianoRoll
                song={song}
                layout={layout}
                currentBeatRef={playback.currentBeatRef}
                isDark={isDark}
              />
            </div>
            <PianoKeyboard
              startOctave={startOctave}
              numOctaves={numOctaves}
              activeNotes={activeNotes}
              onNoteOn={handleNoteOn}
              onNoteOff={handleNoteOff}
            />
          </div>
        ) : (
          <div className="relative min-h-0 flex-1">
            <SheetMusic song={song} currentBeat={playback.displayBeat} isDark={isDark} />
          </div>
        )}
      </div>

      {/* Legend (roll mode) */}
      {mode === 'roll' && (
        <div className="flex items-center justify-center gap-4 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#2DD4BF' }} />
            Left hand
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#7C3AED' }} />
            Right hand
          </span>
        </div>
      )}

      {/* Controls */}
      <PlaybackControls
        isPlaying={playback.isPlaying}
        onPlayPause={playback.isPlaying ? playback.pause : playback.play}
        onRestart={playback.restart}
        currentBeat={playback.displayBeat}
        durationBeats={playback.durationBeats}
        beatsPerBar={song.timeSignature[0]}
        onSeek={playback.seek}
        tempoScale={playback.tempoScale}
        onTempoChange={playback.setTempoScale}
        mode={mode}
        onModeChange={setMode}
      />
    </div>
  )
}
