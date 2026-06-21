// Educational illustrations for beginner lesson tips.
// A flexible mini-keyboard plus staff/clef diagrams, selected by id.

interface IllustrationProps {
  className?: string
}

// White key letters in one octave
const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
// Black keys: which white key they sit after, and their sharp/flat names
const BLACKS = [
  { after: 0, sharp: 'C♯', flat: 'D♭' },
  { after: 1, sharp: 'D♯', flat: 'E♭' },
  { after: 3, sharp: 'F♯', flat: 'G♭' },
  { after: 4, sharp: 'G♯', flat: 'A♭' },
  { after: 5, sharp: 'A♯', flat: 'B♭' },
]

const WK_W = 16
const WK_H = 64
const BK_W = 10
const BK_H = 38

interface MiniKeyboardProps {
  octaves?: number
  /** White-key labels like "C4" octave-agnostic: pass letters e.g. ['C','E','G'] */
  highlightWhite?: string[]
  /** Black-key sharp names to highlight e.g. ['C♯','F♯'] */
  highlightBlack?: string[]
  /** Show letter labels under white keys */
  labels?: boolean
  /** Only label these white letters */
  labelOnly?: string[]
  /** Draw ascending step arrows across highlighted white keys */
  arrows?: boolean
  className?: string
}

/** Reusable mini piano keyboard illustration */
export function MiniKeyboard({
  octaves = 1,
  highlightWhite = [],
  highlightBlack = [],
  labels = false,
  labelOnly,
  arrows = false,
  className,
}: MiniKeyboardProps) {
  const whiteCount = WHITE.length * octaves
  const width = whiteCount * WK_W
  const height = WK_H + (labels ? 18 : 4)

  const whiteHi = new Set(highlightWhite)
  const blackHi = new Set(highlightBlack)

  const highlightedX: number[] = []

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      width="100%"
      role="img"
      aria-hidden="true"
    >
      {/* White keys */}
      {Array.from({ length: whiteCount }).map((_, i) => {
        const letter = WHITE[i % 7]
        const isHi = whiteHi.has(letter)
        const x = i * WK_W
        if (isHi) highlightedX.push(x + WK_W / 2)
        return (
          <g key={`w${i}`}>
            <rect
              x={x + 0.5}
              y={0}
              width={WK_W - 1}
              height={WK_H}
              rx={2}
              className={
                isHi
                  ? 'fill-violet-400 dark:fill-violet-500'
                  : 'fill-white stroke-gray-300 dark:fill-gray-100 dark:stroke-gray-300'
              }
              strokeWidth={1}
            />
            {labels && (!labelOnly || labelOnly.includes(letter)) && (
              <text
                x={x + WK_W / 2}
                y={WK_H + 13}
                textAnchor="middle"
                className={`text-[9px] font-semibold ${isHi ? 'fill-violet-500' : 'fill-gray-400'}`}
              >
                {letter}
              </text>
            )}
          </g>
        )
      })}

      {/* Black keys */}
      {Array.from({ length: octaves }).map((_, oct) =>
        BLACKS.map((b) => {
          const baseWhite = oct * 7 + b.after
          const x = (baseWhite + 1) * WK_W - BK_W / 2
          const isHi = blackHi.has(b.sharp)
          return (
            <rect
              key={`b${oct}-${b.after}`}
              x={x}
              y={0}
              width={BK_W}
              height={BK_H}
              rx={1.5}
              className={
                isHi
                  ? 'fill-violet-600 dark:fill-violet-400'
                  : 'fill-gray-800 dark:fill-gray-900'
              }
            />
          )
        }),
      )}

      {/* Ascending arrows across highlighted keys */}
      {arrows &&
        highlightedX.length > 1 &&
        highlightedX.slice(0, -1).map((x, i) => (
          <line
            key={`arr${i}`}
            x1={x}
            y1={WK_H - 8}
            x2={highlightedX[i + 1]}
            y2={WK_H - 8}
            className="stroke-violet-600 dark:stroke-violet-300"
            strokeWidth={1.5}
            markerEnd="url(#arrowhead)"
          />
        ))}
      {arrows && (
        <defs>
          <marker
            id="arrowhead"
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" className="fill-violet-600 dark:fill-violet-300" />
          </marker>
        </defs>
      )}
    </svg>
  )
}

/** A 5-line staff with an optional clef */
function Staff({
  clef,
  className,
}: {
  clef: 'treble' | 'bass' | 'grand'
  className?: string
}) {
  const lineYs = [10, 18, 26, 34, 42]
  return (
    <svg viewBox="0 0 160 60" className={className} width="100%" role="img" aria-hidden="true">
      {/* Treble / single staff */}
      {clef !== 'grand' && (
        <>
          {lineYs.map((y) => (
            <line key={y} x1={10} y1={y} x2={150} y2={y} className="stroke-gray-400" strokeWidth={1} />
          ))}
          {clef === 'treble' ? (
            <text x={14} y={42} className="fill-gray-800 text-[44px] dark:fill-white" style={{ fontFamily: 'serif' }}>
              𝄞
            </text>
          ) : (
            <text x={16} y={36} className="fill-gray-800 text-[34px] dark:fill-white" style={{ fontFamily: 'serif' }}>
              𝄢
            </text>
          )}
        </>
      )}

      {/* Grand staff: treble on top, bass on bottom, brace */}
      {clef === 'grand' && (
        <>
          {[6, 12, 18, 24, 30].map((y) => (
            <line key={`t${y}`} x1={20} y1={y} x2={150} y2={y} className="stroke-gray-400" strokeWidth={0.8} />
          ))}
          {[36, 42, 48, 54, 60].map((y) => (
            <line key={`b${y}`} x1={20} y1={y} x2={150} y2={y} className="stroke-gray-400" strokeWidth={0.8} />
          ))}
          <path d="M14 4 Q8 16 14 33 Q8 50 14 62" className="fill-none stroke-gray-800 dark:stroke-white" strokeWidth={1.5} />
          <text x={22} y={28} className="fill-gray-800 text-[26px] dark:fill-white" style={{ fontFamily: 'serif' }}>
            𝄞
          </text>
          <text x={24} y={50} className="fill-gray-800 text-[22px] dark:fill-white" style={{ fontFamily: 'serif' }}>
            𝄢
          </text>
        </>
      )}
    </svg>
  )
}

/** Up / down half-step arrow illustration */
function StepArrow({ dir, className }: { dir: 'up' | 'down'; className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} width="100%" role="img" aria-hidden="true">
      {dir === 'up' ? (
        <path d="M30 50 L30 14 M30 14 L20 24 M30 14 L40 24" className="fill-none stroke-violet-500" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M30 10 L30 46 M30 46 L20 36 M30 46 L40 36" className="fill-none stroke-violet-500" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

/**
 * Main illustration switch. Pass an illustration id from the lessons data.
 */
export function LessonIllustration({ id, className }: { id: string } & IllustrationProps) {
  switch (id) {
    // ── Notes / keyboard ──
    case 'alphabet':
      return <MiniKeyboard className={className} labels highlightWhite={[...WHITE]} />
    case 'find-c':
      return <MiniKeyboard className={className} octaves={2} labels labelOnly={['C']} highlightWhite={['C']} />
    case 'octave-repeat':
      return <MiniKeyboard className={className} octaves={2} labels labelOnly={['C']} highlightWhite={['C']} />
    case 'white-keys':
      return <MiniKeyboard className={className} labels highlightWhite={[...WHITE]} />

    // ── Staff / clefs ──
    case 'staff-treble':
      return <Staff clef="treble" className={className} />
    case 'staff-bass':
      return <Staff clef="bass" className={className} />
    case 'grand-staff':
      return <Staff clef="grand" className={className} />

    // ── Sharps / flats ──
    case 'black-keys':
      return <MiniKeyboard className={className} highlightBlack={['C♯', 'D♯', 'F♯', 'G♯', 'A♯']} />
    case 'sharp-up':
      return <StepArrow dir="up" className={className} />
    case 'flat-down':
      return <StepArrow dir="down" className={className} />
    case 'enharmonic':
      return <MiniKeyboard className={className} highlightBlack={['C♯']} highlightWhite={['C', 'D']} />
    case 'no-black-gap':
      return <MiniKeyboard className={className} labels labelOnly={['E', 'F', 'B', 'C']} highlightWhite={['E', 'F', 'B']} />
    case 'half-step':
      return <MiniKeyboard className={className} highlightWhite={['E', 'F']} />

    // ── Intervals ──
    case 'interval-third':
      return <MiniKeyboard className={className} labels labelOnly={['C', 'E']} highlightWhite={['C', 'E']} />
    case 'interval-fifth':
      return <MiniKeyboard className={className} labels labelOnly={['C', 'G']} highlightWhite={['C', 'G']} />
    case 'interval-octave':
      return <MiniKeyboard className={className} octaves={2} labels labelOnly={['C']} highlightWhite={['C']} />
    case 'interval-step':
      return <MiniKeyboard className={className} labels labelOnly={['C', 'D']} highlightWhite={['C', 'D']} />

    // ── Chords ──
    case 'chord-major':
      return <MiniKeyboard className={className} labels labelOnly={['C', 'E', 'G']} highlightWhite={['C', 'E', 'G']} />
    case 'chord-minor':
      return <MiniKeyboard className={className} labels labelOnly={['A', 'C', 'E']} highlightWhite={['A', 'C', 'E']} />
    case 'chord-triad':
      return <MiniKeyboard className={className} highlightWhite={['C', 'E', 'G']} />

    // ── Scales ──
    case 'scale-c-major':
      return <MiniKeyboard className={className} octaves={1} arrows labels highlightWhite={[...WHITE]} />
    case 'scale-vs-chord':
      return <MiniKeyboard className={className} arrows highlightWhite={['C', 'E', 'G']} />

    // ── Ear ──
    case 'ear-waves':
      return (
        <svg viewBox="0 0 64 64" className={className} width="100%" role="img" aria-hidden="true">
          <path d="M22 40 C18 40 14 36 14 30 C14 24 16 20 20 16 C24 12 28 14 30 16" className="fill-none stroke-violet-500" strokeWidth={3} strokeLinecap="round" />
          <path d="M36 22 C40 26 40 34 36 38" className="fill-none stroke-violet-400" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M42 18 C48 24 48 36 42 42" className="fill-none stroke-violet-400" strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
          <path d="M48 14 C56 22 56 38 48 46" className="fill-none stroke-violet-400" strokeWidth={2.5} strokeLinecap="round" opacity={0.35} />
        </svg>
      )

    // ── Rhythm ──
    case 'note-values':
      return (
        <svg viewBox="0 0 160 50" className={className} width="100%" role="img" aria-hidden="true">
          {/* whole, half, quarter notes */}
          <ellipse cx={20} cy={30} rx={9} ry={6.5} className="fill-none stroke-gray-800 dark:stroke-white" strokeWidth={2.5} />
          <text x={20} y={48} textAnchor="middle" className="fill-gray-400 text-[8px]">4</text>
          <g>
            <ellipse cx={64} cy={30} rx={8} ry={6} className="fill-none stroke-gray-800 dark:stroke-white" strokeWidth={2.5} />
            <line x1={71} y1={30} x2={71} y2={6} className="stroke-gray-800 dark:stroke-white" strokeWidth={2} />
            <text x={66} y={48} textAnchor="middle" className="fill-gray-400 text-[8px]">2</text>
          </g>
          <g>
            <ellipse cx={108} cy={30} rx={8} ry={6} className="fill-gray-800 dark:fill-white" />
            <line x1={115} y1={30} x2={115} y2={6} className="stroke-gray-800 dark:stroke-white" strokeWidth={2} />
            <text x={110} y={48} textAnchor="middle" className="fill-gray-400 text-[8px]">1</text>
          </g>
          <g>
            <ellipse cx={144} cy={30} rx={7} ry={5.5} className="fill-gray-800 dark:fill-white" />
            <line x1={150} y1={30} x2={150} y2={8} className="stroke-gray-800 dark:stroke-white" strokeWidth={2} />
            <path d="M150 8 C156 12 156 18 152 20" className="fill-none stroke-gray-800 dark:stroke-white" strokeWidth={2} />
            <text x={146} y={48} textAnchor="middle" className="fill-gray-400 text-[8px]">½</text>
          </g>
        </svg>
      )
    case 'metronome':
      return (
        <svg viewBox="0 0 60 64" className={className} width="100%" role="img" aria-hidden="true">
          <path d="M22 54 L38 54 L34 12 L26 12 Z" className="fill-none stroke-violet-500" strokeWidth={2.5} strokeLinejoin="round" />
          <line x1={30} y1={50} x2={42} y2={18} className="stroke-violet-500" strokeWidth={2} strokeLinecap="round" />
          <circle cx={42} cy={18} r={3} className="fill-violet-500" />
        </svg>
      )

    default:
      return <MiniKeyboard className={className} />
  }
}
