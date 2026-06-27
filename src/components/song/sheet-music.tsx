import { useEffect, useMemo, useRef } from 'react'
import type { Song, SongNote } from '#/lib/songs/types'
import { songBarCount } from '#/lib/songs/types'

interface SheetMusicProps {
  song: Song
  /** Throttled playback position in beats (drives highlight + auto-scroll). */
  currentBeat: number
  isDark?: boolean
}

// pitch class -> natural letter index (C=0..B=6) + whether it's a sharp
const PC_INFO: { letter: number; sharp: boolean }[] = [
  { letter: 0, sharp: false }, // C
  { letter: 0, sharp: true }, // C#
  { letter: 1, sharp: false }, // D
  { letter: 1, sharp: true }, // D#
  { letter: 2, sharp: false }, // E
  { letter: 3, sharp: false }, // F
  { letter: 3, sharp: true }, // F#
  { letter: 4, sharp: false }, // G
  { letter: 4, sharp: true }, // G#
  { letter: 5, sharp: false }, // A
  { letter: 5, sharp: true }, // A#
  { letter: 6, sharp: false }, // B
]

function diatonicOf(midi: number): { d: number; sharp: boolean } {
  const pc = ((midi % 12) + 12) % 12
  const oct = Math.floor(midi / 12) - 1
  const info = PC_INFO[pc]
  return { d: oct * 7 + info.letter, sharp: info.sharp }
}

// Layout constants (SVG user units)
const VIEW_W = 820
const MEASURES_PER_SYSTEM = 2
const LINE_GAP = 9
const HALF = LINE_GAP / 2
const LEFT_MARGIN = 64
const RIGHT_MARGIN = 16

const SYS_TOP = 26
const TREBLE_TOP_Y = SYS_TOP // F5 line
const TREBLE_BOTTOM_Y = TREBLE_TOP_Y + 4 * LINE_GAP // E4 line
const BASS_TOP_Y = TREBLE_BOTTOM_Y + 46 // A3 line
const BASS_BOTTOM_Y = BASS_TOP_Y + 4 * LINE_GAP // G2 line
const SYSTEM_H = BASS_BOTTOM_Y + 28

// Diatonic reference values
const TREBLE_BOTTOM_D = 4 * 7 + 2 // E4 = 30
const TREBLE_TOP_D = 5 * 7 + 3 // F5 = 38
const BASS_BOTTOM_D = 2 * 7 + 4 // G2 = 18
const BASS_TOP_D = 3 * 7 + 5 // A3 = 26

function trebleY(d: number) {
  return TREBLE_BOTTOM_Y - (d - TREBLE_BOTTOM_D) * HALF
}
function bassY(d: number) {
  return BASS_BOTTOM_Y - (d - BASS_BOTTOM_D) * HALF
}

interface PlacedNote extends SongNote {
  measureInSystem: number
  beatInBar: number
}

export function SheetMusic({ song, currentBeat, isDark = false }: SheetMusicProps) {
  const beatsPerBar = song.timeSignature[0]
  const measureWidth = (VIEW_W - LEFT_MARGIN - RIGHT_MARGIN) / MEASURES_PER_SYSTEM

  // Group notes into systems
  const systems = useMemo(() => {
    const totalBars = songBarCount(song)
    const systemCount = Math.max(1, Math.ceil(totalBars / MEASURES_PER_SYSTEM))
    const buckets: PlacedNote[][] = Array.from({ length: systemCount }, () => [])
    for (const n of song.notes) {
      const bar = Math.floor(n.start / beatsPerBar)
      const sys = Math.floor(bar / MEASURES_PER_SYSTEM)
      buckets[sys].push({
        ...n,
        measureInSystem: bar % MEASURES_PER_SYSTEM,
        beatInBar: n.start - bar * beatsPerBar,
      })
    }
    return buckets
  }, [song, beatsPerBar])

  const noteX = (measureInSystem: number, beatInBar: number) =>
    LEFT_MARGIN + measureInSystem * measureWidth + (beatInBar / beatsPerBar) * measureWidth + 22

  // Auto-scroll to active system
  const containerRef = useRef<HTMLDivElement | null>(null)
  const systemRefs = useRef<(HTMLDivElement | null)[]>([])
  const activeSystem = Math.floor(Math.floor(currentBeat / beatsPerBar) / MEASURES_PER_SYSTEM)
  useEffect(() => {
    const el = systemRefs.current[activeSystem]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeSystem])

  const lineColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.55)'
  const inkColor = isDark ? '#E5E7EB' : '#1F2937'

  function renderLedgers(x: number, d: number, clef: 'treble' | 'bass') {
    const topD = clef === 'treble' ? TREBLE_TOP_D : BASS_TOP_D
    const botD = clef === 'treble' ? TREBLE_BOTTOM_D : BASS_BOTTOM_D
    const yOf = clef === 'treble' ? trebleY : bassY
    const lines: number[] = []
    if (d > topD) {
      for (let dd = topD + 2; dd <= d; dd += 2) lines.push(dd)
    } else if (d < botD) {
      for (let dd = botD - 2; dd >= d; dd -= 2) lines.push(dd)
    }
    return lines.map((dd, i) => (
      <line
        key={i}
        x1={x - 8}
        y1={yOf(dd)}
        x2={x + 8}
        y2={yOf(dd)}
        stroke={lineColor}
        strokeWidth={1}
      />
    ))
  }

  function renderNote(n: PlacedNote, idx: number) {
    const clef: 'treble' | 'bass' = n.hand === 'right' ? 'treble' : 'bass'
    const { d, sharp } = diatonicOf(n.midi)
    const x = noteX(n.measureInSystem, n.beatInBar)
    const y = clef === 'treble' ? trebleY(d) : bassY(d)
    const active = n.start <= currentBeat && currentBeat < n.start + n.duration
    const color = active ? (n.hand === 'right' ? '#7C3AED' : '#0E7490') : inkColor
    const filled = n.duration < 2 // quarter/eighth filled; half/whole open
    const stemUp = clef === 'treble'
    const stemLen = 22
    const showStem = n.duration < 4

    return (
      <g key={idx}>
        {renderLedgers(x, d, clef)}
        {sharp && (
          <text
            x={x - 13}
            y={y + 3.5}
            fontSize={13}
            fill={color}
            style={{ fontFamily: 'serif' }}
          >
            ♯
          </text>
        )}
        <ellipse
          cx={x}
          cy={y}
          rx={5}
          ry={3.7}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? 0 : 1.6}
          transform={`rotate(-18 ${x} ${y})`}
        />
        {showStem && (
          <line
            x1={stemUp ? x + 4.6 : x - 4.6}
            y1={y}
            x2={stemUp ? x + 4.6 : x - 4.6}
            y2={stemUp ? y - stemLen : y + stemLen}
            stroke={color}
            strokeWidth={1.4}
          />
        )}
      </g>
    )
  }

  function staffLines(topY: number) {
    return [0, 1, 2, 3, 4].map((i) => (
      <line
        key={i}
        x1={LEFT_MARGIN - 12}
        y1={topY + i * LINE_GAP}
        x2={VIEW_W - RIGHT_MARGIN}
        y2={topY + i * LINE_GAP}
        stroke={lineColor}
        strokeWidth={1}
      />
    ))
  }

  function barLines() {
    const lines = []
    for (let i = 0; i <= MEASURES_PER_SYSTEM; i++) {
      const x = LEFT_MARGIN + i * measureWidth
      lines.push(
        <line
          key={i}
          x1={x}
          y1={TREBLE_TOP_Y}
          x2={x}
          y2={BASS_BOTTOM_Y}
          stroke={lineColor}
          strokeWidth={i === 0 ? 1.4 : 1}
        />,
      )
    }
    return lines
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-y-auto rounded-xl px-2 py-3"
      style={{ background: isDark ? '#0E0B16' : '#FBFAFE' }}
    >
      <div className="mx-auto max-w-4xl">
        {systems.map((sysNotes, si) => (
          <div
            key={si}
            ref={(el) => {
              systemRefs.current[si] = el
            }}
            className={`mb-1 rounded-lg transition-colors ${
              si === activeSystem ? 'bg-violet-500/5' : ''
            }`}
          >
            <svg viewBox={`0 0 ${VIEW_W} ${SYSTEM_H}`} width="100%" role="img" aria-hidden="true">
              {/* Brace + clefs */}
              <path
                d={`M ${LEFT_MARGIN - 18} ${TREBLE_TOP_Y} Q ${LEFT_MARGIN - 28} ${
                  (TREBLE_TOP_Y + BASS_BOTTOM_Y) / 2
                } ${LEFT_MARGIN - 18} ${BASS_BOTTOM_Y}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={1.6}
              />
              <text
                x={LEFT_MARGIN - 8}
                y={TREBLE_BOTTOM_Y + 2}
                fontSize={38}
                fill={inkColor}
                style={{ fontFamily: 'serif' }}
              >
                𝄞
              </text>
              <text
                x={LEFT_MARGIN - 8}
                y={BASS_TOP_Y + 14}
                fontSize={30}
                fill={inkColor}
                style={{ fontFamily: 'serif' }}
              >
                𝄢
              </text>

              {staffLines(TREBLE_TOP_Y)}
              {staffLines(BASS_TOP_Y)}
              {barLines()}

              {sysNotes.map(renderNote)}
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
