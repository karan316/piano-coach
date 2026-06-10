import { useCallback, useRef } from 'react'
import { generateKeyRange, isBlackKey, midiToLetter } from '#/lib/notes'

interface PianoKeyboardProps {
  startOctave?: number
  numOctaves?: number
  activeNotes?: Set<number>
  highlightedNotes?: Map<number, 'correct' | 'incorrect' | 'prompt'>
  onNoteOn?: (midi: number) => void
  onNoteOff?: (midi: number) => void
  showLabels?: boolean
  interactive?: boolean
}

export function PianoKeyboard({
  startOctave = 3,
  numOctaves = 2,
  activeNotes = new Set(),
  highlightedNotes = new Map(),
  onNoteOn,
  onNoteOff,
  showLabels = false,
  interactive = true,
}: PianoKeyboardProps) {
  const keys = generateKeyRange(startOctave, numOctaves)
  const pressedRef = useRef<Set<number>>(new Set())

  const whiteKeys = keys.filter((k) => !isBlackKey(k))
  const totalWhiteKeys = whiteKeys.length

  const handlePointerDown = useCallback(
    (midi: number) => {
      if (!interactive) return
      if (pressedRef.current.has(midi)) return
      pressedRef.current.add(midi)
      onNoteOn?.(midi)
    },
    [interactive, onNoteOn],
  )

  const handlePointerUp = useCallback(
    (midi: number) => {
      if (!interactive) return
      pressedRef.current.delete(midi)
      onNoteOff?.(midi)
    },
    [interactive, onNoteOff],
  )

  const handlePointerLeave = useCallback(
    (midi: number) => {
      if (pressedRef.current.has(midi)) {
        pressedRef.current.delete(midi)
        onNoteOff?.(midi)
      }
    },
    [onNoteOff],
  )

  // Calculate white key positions
  const whiteKeyWidth = 100 / totalWhiteKeys // percentage

  // Map each white key to its index position
  const whiteKeyPositions = new Map<number, number>()
  whiteKeys.forEach((midi, index) => {
    whiteKeyPositions.set(midi, index)
  })

  // Black key positions: placed between specific white key pairs
  // C#/Db between C and D, D#/Eb between D and E, F#/Gb between F and G, etc.
  const blackKeyData: { midi: number; leftPercent: number }[] = []
  for (const midi of keys) {
    if (!isBlackKey(midi)) continue
    // Black key is between the white key before it and after it
    const prevWhite = midi - 1
    const prevPos = whiteKeyPositions.get(prevWhite)
    if (prevPos !== undefined) {
      blackKeyData.push({
        midi,
        leftPercent: (prevPos + 1) * whiteKeyWidth - whiteKeyWidth * 0.3,
      })
    }
  }

  function getKeyHighlight(midi: number): string {
    const highlight = highlightedNotes.get(midi)
    const isActive = activeNotes.has(midi)
    const isBlack = isBlackKey(midi)

    if (highlight === 'correct') {
      return isBlack
        ? 'bg-emerald-500 shadow-emerald-400/50 shadow-lg'
        : 'bg-emerald-200 shadow-emerald-300/50 shadow-lg ring-2 ring-emerald-400'
    }
    if (highlight === 'incorrect') {
      return isBlack
        ? 'bg-red-500 shadow-red-400/50 shadow-lg'
        : 'bg-red-200 shadow-red-300/50 shadow-lg ring-2 ring-red-400'
    }
    if (highlight === 'prompt') {
      return isBlack
        ? 'bg-blue-500 shadow-blue-400/50 shadow-lg'
        : 'bg-blue-100 shadow-blue-200/50 shadow-lg ring-2 ring-blue-400'
    }
    if (isActive) {
      return isBlack
        ? 'bg-amber-500 shadow-amber-400/60 shadow-lg'
        : 'bg-amber-100 shadow-amber-200/50 shadow-md ring-2 ring-amber-400'
    }
    return ''
  }

  return (
    <div className="relative w-full select-none" style={{ touchAction: 'manipulation' }}>
      {/* Wood trim above keys */}
      <div className="h-3 rounded-t-lg bg-gradient-to-b from-amber-950 via-amber-900 to-amber-800 shadow-inner dark:from-gray-900 dark:via-gray-800 dark:to-gray-700" />

      {/* Piano body */}
      <div className="relative overflow-hidden rounded-b-lg bg-gray-100 shadow-xl dark:bg-gray-900" style={{ aspectRatio: `${totalWhiteKeys * 1.4}/4` }}>
        {/* White keys */}
        {whiteKeys.map((midi, index) => {
          const isActive = activeNotes.has(midi)
          const highlight = getKeyHighlight(midi)
          const label = midiToLetter(midi)

          return (
            <button
              key={midi}
              aria-label={`Piano key ${label}`}
              className={`absolute top-0 bottom-0 border-r border-gray-200 transition-all duration-75 dark:border-gray-700 ${
                isActive && !highlight
                  ? 'translate-y-0.5 bg-gradient-to-b from-gray-100 to-gray-200 shadow-inner dark:from-gray-200 dark:to-gray-300'
                  : highlight
                    ? `translate-y-0.5 ${highlight}`
                    : 'bg-gradient-to-b from-white via-white to-gray-50 shadow-sm hover:from-gray-50 hover:to-gray-100 active:translate-y-0.5 active:shadow-inner dark:from-gray-50 dark:via-gray-100 dark:to-gray-200'
              }`}
              style={{
                left: `${index * whiteKeyWidth}%`,
                width: `${whiteKeyWidth}%`,
                borderRadius: '0 0 6px 6px',
              }}
              onPointerDown={() => handlePointerDown(midi)}
              onPointerUp={() => handlePointerUp(midi)}
              onPointerLeave={() => handlePointerLeave(midi)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Key bottom groove effect */}
              <div className="absolute right-1 bottom-1 left-1 h-2 rounded-b bg-gradient-to-b from-transparent to-gray-200 dark:to-gray-300" />

              {/* Label */}
              {showLabels && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-400 select-none">
                  {label}
                </span>
              )}
            </button>
          )
        })}

        {/* Black keys */}
        {blackKeyData.map(({ midi, leftPercent }) => {
          const isActive = activeNotes.has(midi)
          const highlight = getKeyHighlight(midi)
          const label = midiToLetter(midi)

          return (
            <button
              key={midi}
              aria-label={`Piano key ${label}`}
              className={`absolute top-0 z-10 transition-all duration-75 ${
                isActive && !highlight
                  ? 'translate-y-0.5 bg-gradient-to-b from-gray-700 to-gray-800 shadow-md'
                  : highlight
                    ? `translate-y-0.5 ${highlight}`
                    : 'bg-gradient-to-b from-gray-800 via-gray-900 to-black shadow-lg hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 active:translate-y-0.5 active:from-gray-800 active:to-black active:shadow-md'
              }`}
              style={{
                left: `${leftPercent}%`,
                width: `${whiteKeyWidth * 0.6}%`,
                height: '60%',
                borderRadius: '0 0 4px 4px',
              }}
              onPointerDown={() => handlePointerDown(midi)}
              onPointerUp={() => handlePointerUp(midi)}
              onPointerLeave={() => handlePointerLeave(midi)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Glossy highlight effect */}
              <div className="absolute top-0 right-0.5 left-0.5 h-1/4 rounded-b bg-gradient-to-b from-white/10 to-transparent" />

              {/* Label */}
              {showLabels && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-400 select-none">
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom shadow */}
      <div className="h-1.5 rounded-b-xl bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800" />
    </div>
  )
}
