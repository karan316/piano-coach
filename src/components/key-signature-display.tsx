import type { KeySignature } from '#/lib/scales'

interface KeySignatureDisplayProps {
  keySignature: KeySignature
  className?: string
}

// Staff positions for sharps (treble clef): F, C, G, D, A, E, B
const SHARP_POSITIONS = [8, 5, 9, 6, 3, 7, 4] // staff lines from bottom (0 = below staff)
// Staff positions for flats (treble clef): B, E, A, D, G, C, F
const FLAT_POSITIONS = [4, 7, 3, 6, 2, 5, 1]

export function KeySignatureDisplay({ keySignature, className = '' }: KeySignatureDisplayProps) {
  const width = 240
  const height = 120
  const staffTop = 25
  const lineSpacing = 14
  const lines = Array.from({ length: 5 }, (_, i) => staffTop + i * lineSpacing)

  const accidentals = keySignature.sharps.length > 0 ? keySignature.sharps : keySignature.flats
  const isSharp = keySignature.sharps.length > 0
  const positions = isSharp ? SHARP_POSITIONS : FLAT_POSITIONS
  const symbol = isSharp ? '♯' : '♭'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className={className} style={{ maxWidth: width, maxHeight: height }}>
      {/* Staff lines */}
      {lines.map((y, i) => (
        <line key={i} x1={10} y1={y} x2={width - 10} y2={y} stroke="currentColor" strokeWidth="1" opacity="0.4" />
      ))}

      {/* Accidentals */}
      {accidentals.length === 0 && (
        <text x={width / 2} y={staffTop + lineSpacing * 2 + 5} fontSize="14" fill="currentColor" textAnchor="middle" opacity="0.5">
          No sharps or flats
        </text>
      )}
      {accidentals.map((_, i) => {
        const pos = positions[i]
        const bottomLine = lines[4]
        const y = bottomLine - pos * (lineSpacing / 2) + 6
        const x = 45 + i * 16

        return (
          <text
            key={i}
            x={x}
            y={y}
            fontSize="20"
            fontWeight="bold"
            fill="currentColor"
            textAnchor="middle"
          >
            {symbol}
          </text>
        )
      })}

      {/* "?" label */}
      <text x={width / 2} y={height - 5} fontSize="12" fill="currentColor" textAnchor="middle" opacity="0.5">
        ?
      </text>
    </svg>
  )
}
