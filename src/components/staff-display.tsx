import { staffPosition, type Accidental, midiToNoteInfo } from '#/lib/notes'

interface StaffDisplayProps {
  /** MIDI note numbers to display on the staff */
  notes?: number[]
  /** Whether to prefer flat notation */
  preferFlats?: boolean
  /** Optional class name */
  className?: string
  /** Width of the SVG */
  width?: number
  /** Height of the SVG */
  height?: number
  /** Whether to show note name labels below notes */
  showLabels?: boolean
}

// Staff layout constants
const STAFF_TOP = 30
const LINE_SPACING = 14
const STAFF_LINES = 5
const NOTE_RX = 9
const NOTE_RY = 6
const CLEF_X = 30
const NOTE_X = 120

export function StaffDisplay({
  notes = [],
  preferFlats = false,
  className = '',
  width = 220,
  height = 140,
  showLabels = true,
}: StaffDisplayProps) {
  // Staff line Y positions (top line = index 0)
  const lineYs = Array.from({ length: STAFF_LINES }, (_, i) => STAFF_TOP + i * LINE_SPACING)
  const bottomLineY = lineYs[STAFF_LINES - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className={className}
      style={{ maxWidth: width, maxHeight: height }}
    >
      {/* Staff lines */}
      {lineYs.map((y, i) => (
        <line
          key={i}
          x1={15}
          y1={y}
          x2={width - 15}
          y2={y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.4"
        />
      ))}

      {/* Treble clef */}
      <TrebleClef x={CLEF_X} y={lineYs[0]} height={LINE_SPACING * 5.5} />

      {/* Notes */}
      {notes.map((midi, i) => {
        const info = midiToNoteInfo(midi, preferFlats)
        const pos = staffPosition(midi)

        // Y position: bottom line (E4) = lineYs[4], each position = half line spacing
        const noteY = bottomLineY - pos * (LINE_SPACING / 2)
        const noteX = NOTE_X + i * 40

        // Determine if ledger lines are needed
        const ledgerLines: number[] = []

        // Below staff (below E4, pos < 0)
        if (pos < 0) {
          // Add ledger lines at even positions below the bottom line
          for (let p = -2; p >= pos - 1; p -= 2) {
            const ly = bottomLineY - p * (LINE_SPACING / 2)
            if (ly > bottomLineY) ledgerLines.push(ly)
          }
        }

        // Above staff (above F5, pos > 8)
        if (pos > 8) {
          for (let p = 10; p <= pos + 1; p += 2) {
            const ly = bottomLineY - p * (LINE_SPACING / 2)
            if (ly < lineYs[0]) ledgerLines.push(ly)
          }
        }

        // Middle C ledger line (pos = -2, i.e. C4)
        if (pos === -2) {
          ledgerLines.push(bottomLineY + LINE_SPACING)
        }

        return (
          <g key={`${midi}-${i}`}>
            {/* Ledger lines */}
            {ledgerLines.map((ly, li) => (
              <line
                key={li}
                x1={noteX - NOTE_RX - 4}
                y1={ly}
                x2={noteX + NOTE_RX + 4}
                y2={ly}
                stroke="currentColor"
                strokeWidth="1.2"
                opacity="0.5"
              />
            ))}

            {/* Accidental */}
            {info.accidental && (
              <text
                x={noteX - NOTE_RX - 8}
                y={noteY + 5}
                fontSize="16"
                fontWeight="bold"
                fill="currentColor"
                textAnchor="end"
              >
                {info.accidental === '#' ? '♯' : '♭'}
              </text>
            )}

            {/* Note head (filled oval) */}
            <ellipse
              cx={noteX}
              cy={noteY}
              rx={NOTE_RX}
              ry={NOTE_RY}
              fill="currentColor"
              transform={`rotate(-12 ${noteX} ${noteY})`}
              className="animate-note-appear"
            />

            {/* Stem */}
            {pos <= 4 ? (
              // Stem up (for notes on or below middle line)
              <line
                x1={noteX + NOTE_RX - 1}
                y1={noteY}
                x2={noteX + NOTE_RX - 1}
                y2={noteY - LINE_SPACING * 3}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              // Stem down (for notes above middle line)
              <line
                x1={noteX - NOTE_RX + 1}
                y1={noteY}
                x2={noteX - NOTE_RX + 1}
                y2={noteY + LINE_SPACING * 3}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}

            {/* Note name label below */}
            {showLabels && (
              <text
              x={noteX}
              y={height - 8}
              fontSize="13"
              fontWeight="600"
              fill="currentColor"
              textAnchor="middle"
              opacity="0.7"
            >
              {info.name.replace('#', '♯').replace('b', '♭')}
            </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Simplified treble clef SVG path */
function TrebleClef({ x, y, height }: { x: number; y: number; height: number }) {
  const scale = height / 80
  return (
    <g transform={`translate(${x - 12 * scale}, ${y - 8 * scale}) scale(${scale})`}>
      <path
        d="M12 65 C8 58 6 48 8 38 C10 28 14 22 16 16 C18 10 18 4 16 2 C14 0 12 2 12 8 C12 14 14 22 16 28 C18 34 18 42 16 48 C14 54 10 60 12 68 C13 72 16 74 18 72 C20 70 20 66 18 64"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </g>
  )
}

/** Hook to get accidental symbol */
export function accidentalToSymbol(acc: Accidental): string {
  if (acc === '#') return '♯'
  if (acc === 'b') return '♭'
  return ''
}
