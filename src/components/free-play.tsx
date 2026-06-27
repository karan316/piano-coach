import { useState, useCallback, useEffect } from 'react'
import { midiToNoteInfo, noteNameToMidi } from '#/lib/notes'
import { useAudio } from '#/hooks/use-audio'
import { useMidi } from '#/hooks/use-midi'
import { useKeyboardInput } from '#/hooks/use-keyboard-input'
import { PianoKeyboard } from './piano-keyboard'
import { StaffDisplay } from './staff-display'
import { ArrowLeft } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

interface FreePlayProps {
  onBack: () => void
}

function getStoredSetting<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  const stored = localStorage.getItem(key)
  if (stored === null) return fallback
  try {
    return JSON.parse(stored) as T
  } catch {
    return fallback
  }
}

export function FreePlay({ onBack }: FreePlayProps) {
  const [octaves] = useState(() => getStoredSetting('piano-octaves', 2))
  const [startOctave] = useState(() => getStoredSetting('piano-start-octave', 4))
  const [showLabels, setShowLabels] = useState(true)
  const [currentNotes, setCurrentNotes] = useState<number[]>([])
  const [pointerNotes, setPointerNotes] = useState<Set<number>>(new Set())

  const audio = useAudio()
  const midi = useMidi()
  const keyboard = useKeyboardInput({ baseOctave: startOctave })

  // Preload piano samples for the current range
  useEffect(() => {
    if (audio.mode === 'grand') {
      const startMidi = (startOctave + 1) * 12
      const endMidi = startMidi + octaves * 12
      void audio.preloadSamples(startMidi, endMidi)
    }
  }, [audio, startOctave, octaves])

  const allActiveNotes = new Set([...midi.activeNotes, ...keyboard.activeKeys, ...pointerNotes])

  // Track currently played notes for staff display
  useEffect(() => {
    const notes = [...allActiveNotes]
    if (notes.length > 0) {
      setCurrentNotes(notes)
    }
  }, [midi.activeNotes, keyboard.activeKeys, pointerNotes])

  const handleNoteOn = useCallback(
    (midiNote: number) => {
      audio.startNote(midiNote)
      setPointerNotes((prev) => { const next = new Set(prev); next.add(midiNote); return next })
    },
    [audio],
  )

  const handleNoteOff = useCallback(
    (midiNote: number) => {
      audio.releaseNote(midiNote)
      setPointerNotes((prev) => { const next = new Set(prev); next.delete(midiNote); return next })
    },
    [audio],
  )

  // Subscribe to input events
  useEffect(() => {
    const unsubMidi = midi.onNoteOn((note) => {
      audio.startNote(note)
    })
    return unsubMidi
  }, [midi, audio])

  useEffect(() => {
    const unsubOn = keyboard.onNoteOn((note) => audio.startNote(note))
    const unsubOff = keyboard.onNoteOff((note) => audio.releaseNote(note))
    return () => { unsubOn(); unsubOff() }
  }, [keyboard, audio])

  // Current note info for display
  const displayNotes = currentNotes.length > 0 ? currentNotes : []
  const noteInfos = displayNotes.map((m) => midiToNoteInfo(m))

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div />

        <div className="flex items-center gap-2">
          {/* Sound mode toggle */}
          <ToggleGroup
            type="single"
            value={[audio.mode]}
            onValueChange={(v) => { if (v.length) audio.setMode(v[0] as 'grand' | 'electric') }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="grand" className="text-[10px]">
              🎹 Grand
            </ToggleGroupItem>
            <ToggleGroupItem value="electric" className="text-[10px]">
              ⚡ Electric
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Labels toggle */}
          <Button
            variant={showLabels ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? 'Labels On' : 'Labels Off'}
          </Button>

          {/* Virtual piano sound toggle (auto-off with a hardware keyboard) */}
          <Button
            variant={audio.outputEnabled ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => audio.setOutputEnabled(!audio.outputEnabled)}
            title="Turns off automatically when a hardware keyboard is connected"
          >
            {audio.outputEnabled ? '🔊 Sound' : '🔇 Muted'}
          </Button>
        </div>
      </div>

      {/* Staff + Note info area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
        <h2 className="font-display text-3xl text-foreground">Free Play</h2>
        <p className="text-sm text-muted-foreground">
          Play any key to see it on the staff
        </p>

        {/* Staff display */}
        <div className="text-gray-700 dark:text-gray-200">
          <StaffDisplay
            notes={displayNotes.slice(0, 4)}
            width={280}
            height={140}
          />
        </div>

        {/* Note name display */}
        {noteInfos.length > 0 && (
          <div className="flex gap-3">
            {noteInfos.map((info, i) => (
              <div key={i} className="text-center">
                <span className="font-display text-3xl text-gray-800 dark:text-gray-100">
                  {info.name.replace('#', '♯').replace('b', '♭')}
                </span>
                <p className="mt-1 text-xs text-gray-400">
                  {Math.round(info.frequency)} Hz
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Piano */}
      <div className="px-2 pb-3 sm:px-4 sm:pb-4">
        <PianoKeyboard
          startOctave={startOctave}
          numOctaves={octaves}
          activeNotes={allActiveNotes}
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          showLabels={showLabels}
        />
      </div>
    </div>
  )
}
