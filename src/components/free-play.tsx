import { useState, useCallback, useEffect } from 'react'
import { midiToNoteInfo, noteNameToMidi } from '#/lib/notes'
import { useAudio } from '#/hooks/use-audio'
import { useMidi } from '#/hooks/use-midi'
import { useKeyboardInput } from '#/hooks/use-keyboard-input'
import { PianoKeyboard } from './piano-keyboard'
import { StaffDisplay } from './staff-display'
import { ArrowLeft } from 'lucide-react'

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

  const allActiveNotes = new Set([...midi.activeNotes, ...keyboard.activeKeys])

  // Track currently played notes for staff display
  useEffect(() => {
    const notes = [...allActiveNotes]
    if (notes.length > 0) {
      setCurrentNotes(notes)
    }
  }, [midi.activeNotes, keyboard.activeKeys])

  const handleNoteOn = useCallback(
    (midiNote: number) => {
      audio.startNote(midiNote)
    },
    [audio],
  )

  const handleNoteOff = useCallback(
    (midiNote: number) => {
      audio.releaseNote(midiNote)
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
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Free Play</h1>

        <div className="flex items-center gap-2">
          {/* Sound mode toggle */}
          <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-[#1A1525]">
            <button
              onClick={() => audio.setMode('grand')}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                audio.mode === 'grand'
                  ? 'bg-white text-violet-700 shadow-sm dark:bg-[#241E35] dark:text-violet-300'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              🎹 Grand
            </button>
            <button
              onClick={() => audio.setMode('electric')}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                audio.mode === 'electric'
                  ? 'bg-white text-violet-700 shadow-sm dark:bg-[#241E35] dark:text-violet-300'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              ⚡ Electric
            </button>
          </div>

          {/* Labels toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              showLabels
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'bg-gray-100 text-gray-500 dark:bg-[#1A1525] dark:text-gray-400'
            }`}
          >
            {showLabels ? 'Labels On' : 'Labels Off'}
          </button>
        </div>
      </div>

      {/* Staff + Note info area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
        <p className="text-sm text-gray-400 dark:text-gray-500">
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
