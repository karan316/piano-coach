import { useCallback, useRef, useState } from 'react'
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
  const [pointerPressed, setPointerPressed] = useState<Set<number>>(new Set())

  const whiteKeys = keys.filter((k) => !isBlackKey(k))
  const totalWhiteKeys = whiteKeys.length

  const handlePointerDown = useCallback(
    (midi: number) => {
      if (!interactive) return
      if (pressedRef.current.has(midi)) return
      pressedRef.current.add(midi)
      setPointerPressed((prev) => { const next = new Set(prev); next.add(midi); return next })
      onNoteOn?.(midi)
    },
    [interactive, onNoteOn],
  )

  const handlePointerUp = useCallback(
    (midi: number) => {
      if (!interactive) return
      pressedRef.current.delete(midi)
      setPointerPressed((prev) => { const next = new Set(prev); next.delete(midi); return next })
      onNoteOff?.(midi)
    },
    [interactive, onNoteOff],
  )

  const handlePointerLeave = useCallback(
    (midi: number) => {
      if (pressedRef.current.has(midi)) {
        pressedRef.current.delete(midi)
        setPointerPressed((prev) => { const next = new Set(prev); next.delete(midi); return next })
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
        ? ''
        : ''
    }
    return ''
  }

  return (
    <div className="relative w-full select-none" style={{ touchAction: 'manipulation' }}>
      {/* Wood trim */}
      <div
        className="h-3 rounded-t-lg"
        style={{ background: 'linear-gradient(to bottom, #3d1f0a, #5c2e0e 30%, #4a2409 70%, #2d1506)' }}
      />

      {/* Piano body */}
      <div className="relative overflow-hidden bg-[#181818]" style={{ aspectRatio: `${totalWhiteKeys * 1.4}/4` }}>
        {/* White keys */}
        {whiteKeys.map((midi, index) => {
          const isActive = activeNotes.has(midi)
          const highlight = getKeyHighlight(midi)
          const label = midiToLetter(midi)
          const isPressed = isActive || !!highlight || pointerPressed.has(midi)

          return (
            <button
              key={midi}
              aria-label={`Piano key ${label}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${index * whiteKeyWidth}%`,
                width: `${whiteKeyWidth}%`,
                borderRadius: '0 0 5px 5px',
                borderRight: '1px solid #d0d0d0',
                background: highlight
                  ? undefined
                  : isActive
                    ? 'linear-gradient(to bottom, #fffdf8, #f5f2ec 60%, #ebe8e2)'
                    : 'linear-gradient(to bottom, #ffffff, #f8f8f6 60%, #eae8e3)',
                boxShadow: isPressed
                  ? 'inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 0 rgba(0,0,0,0.1)'
                  : '0 4px 0 #b8b4aa, 0 5px 4px rgba(0,0,0,0.3), inset 0 0 0 rgba(0,0,0,0)',
                transform: isPressed ? 'translateY(3px)' : 'translateY(0)',
                transition: 'transform 50ms ease-out, box-shadow 50ms ease-out',
              }}
              className={highlight ? highlight : ''}
              onPointerDown={() => handlePointerDown(midi)}
              onPointerUp={() => handlePointerUp(midi)}
              onPointerLeave={() => handlePointerLeave(midi)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {showLabels && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-medium text-gray-400 select-none">
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
          const isPressed = isActive || !!highlight || pointerPressed.has(midi)

          return (
            <button
              key={midi}
              aria-label={`Piano key ${label}`}
              style={{
                position: 'absolute',
                top: -3,
                left: `${leftPercent}%`,
                width: `${whiteKeyWidth * 0.58}%`,
                height: 'calc(60% + 3px)',
                borderRadius: '0 0 4px 4px',
                zIndex: 10,
                background: highlight
                  ? undefined
                  : isActive
                    ? 'linear-gradient(to bottom, #333, #181818 40%, #0a0a0a)'
                    : 'linear-gradient(to bottom, #2a2a2a, #111 40%, #000)',
                boxShadow: isPressed
                  ? 'none'
                  : '0 2px 4px rgba(0,0,0,0.08)',
                transform: isPressed ? 'translateY(3px)' : 'translateY(0)',
                transition: 'transform 50ms ease-out, box-shadow 50ms ease-out',
              }}
              className={highlight ? highlight : ''}
              onPointerDown={() => handlePointerDown(midi)}
              onPointerUp={() => handlePointerUp(midi)}
              onPointerLeave={() => handlePointerLeave(midi)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Glossy sheen */}
              <div
                className="pointer-events-none absolute top-0 right-[1px] left-[1px]"
                style={{
                  height: '45%',
                  borderRadius: '0 0 3px 3px',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)',
                }}
              />
              {showLabels && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-medium text-gray-500 select-none">
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom wood lip */}
      <div
        className="h-1.5 rounded-b-lg"
        style={{ background: 'linear-gradient(to bottom, #4a2409, #2d1506)' }}
      />
    </div>
  )
}
