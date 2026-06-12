// Custom SVG icons for each exercise card — unique musical motifs

interface IconProps {
  className?: string
  size?: number
}

/** Quarter note on a line — Note Finder */
export function NoteFinderIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <line x1="12" y1="48" x2="52" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Note stem */}
      <line x1="42" y1="16" x2="42" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Note head */}
      <ellipse cx="34" cy="44" rx="9" ry="6.5" fill="currentColor" transform="rotate(-15 34 44)" />
      {/* Flag */}
      <path d="M42 16 C48 20 50 28 44 32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Treble clef with staff lines — Staff Reader */
export function StaffReaderIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Staff lines */}
      {[24, 30, 36, 42, 48].map((y) => (
        <line key={y} x1="8" y1={y} x2="56" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.3" />
      ))}
      {/* Treble clef (simplified path) */}
      <path
        d="M24 50 C20 46 18 40 20 34 C22 28 26 24 28 20 C30 16 30 12 28 10 C26 8 24 10 24 14 C24 18 26 24 28 28 C30 32 30 38 28 42 C26 46 22 50 24 54"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Note on the staff */}
      <ellipse cx="44" cy="36" rx="6" ry="4.5" fill="currentColor" transform="rotate(-10 44 36)" />
      <line x1="50" y1="20" x2="50" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Sharp and flat symbols — Sharp & Flat */
export function SharpFlatIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Sharp symbol */}
      <g transform="translate(12, 10)">
        <line x1="6" y1="4" x2="6" y2="40" stroke="currentColor" strokeWidth="2" />
        <line x1="16" y1="0" x2="16" y2="36" stroke="currentColor" strokeWidth="2" />
        <line x1="2" y1="12" x2="20" y2="8" stroke="currentColor" strokeWidth="3" />
        <line x1="2" y1="24" x2="20" y2="20" stroke="currentColor" strokeWidth="3" />
      </g>
      {/* Flat symbol */}
      <g transform="translate(38, 10)">
        <line x1="4" y1="2" x2="4" y2="40" stroke="currentColor" strokeWidth="2" />
        <path d="M4 22 C10 18 18 20 18 26 C18 32 10 36 4 34" stroke="currentColor" strokeWidth="2.5" fill="none" />
      </g>
    </svg>
  )
}

/** Two notes with connecting arc — Interval Jump */
export function IntervalIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Staff lines */}
      {[28, 34, 40, 46, 52].map((y) => (
        <line key={y} x1="6" y1={y} x2="58" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.2" />
      ))}
      {/* First note */}
      <ellipse cx="20" cy="46" rx="6" ry="4.5" fill="currentColor" transform="rotate(-10 20 46)" />
      <line x1="26" y1="24" x2="26" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Second note */}
      <ellipse cx="44" cy="34" rx="6" ry="4.5" fill="currentColor" transform="rotate(-10 44 34)" />
      <line x1="50" y1="14" x2="50" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Arc connecting them */}
      <path d="M22 20 C30 8 42 8 48 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  )
}

/** Three stacked notes (chord) — Chord Builder */
export function ChordIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Staff lines */}
      {[22, 28, 34, 40, 46].map((y) => (
        <line key={y} x1="8" y1={y} x2="56" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.2" />
      ))}
      {/* Three chord notes stacked */}
      <ellipse cx="30" cy="46" rx="7" ry="4.5" fill="currentColor" transform="rotate(-10 30 46)" />
      <ellipse cx="30" cy="37" rx="7" ry="4.5" fill="currentColor" transform="rotate(-10 30 37)" />
      <ellipse cx="30" cy="28" rx="7" ry="4.5" fill="currentColor" transform="rotate(-10 30 28)" />
      {/* Stem */}
      <line x1="37" y1="12" x2="37" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Sparkle */}
      <circle cx="48" cy="16" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="52" cy="22" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

/** Ear with sound waves — Ear Training */
export function EarTrainingIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Ear silhouette */}
      <path
        d="M24 44 C20 44 16 40 16 34 C16 28 18 24 22 20 C26 16 30 14 32 18 C34 22 28 26 26 30 C24 34 26 38 24 44Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Earlobe */}
      <path d="M24 44 C22 48 20 48 20 46" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Sound waves */}
      <path d="M38 26 C42 30 42 36 38 40" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M44 22 C50 28 50 38 44 44" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M50 18 C58 26 58 40 50 48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

/** Piano keys with sparkles — Free Play */
export function FreePlayIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Piano keys base */}
      <rect x="8" y="20" width="48" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* White key dividers */}
      <line x1="15" y1="20" x2="15" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="22" y1="20" x2="22" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="29" y1="20" x2="29" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="36" y1="20" x2="36" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="43" y1="20" x2="43" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="50" y1="20" x2="50" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Black keys */}
      <rect x="13" y="20" width="5" height="18" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="20" y="20" width="5" height="18" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="34" y="20" width="5" height="18" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="41" y="20" width="5" height="18" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="48" y="20" width="5" height="18" rx="1" fill="currentColor" opacity="0.7" />
      {/* Sparkles */}
      <g opacity="0.6">
        <path d="M16 10 L17 13 L20 14 L17 15 L16 18 L15 15 L12 14 L15 13Z" fill="currentColor" />
        <path d="M42 8 L43 10 L45 11 L43 12 L42 14 L41 12 L39 11 L41 10Z" fill="currentColor" />
        <path d="M52 14 L52.5 16 L54 16.5 L52.5 17 L52 19 L51.5 17 L50 16.5 L51.5 16Z" fill="currentColor" />
      </g>
    </svg>
  )
}

/** Rising bar chart with music note — Practice Stats */
export function StatsIcon({ className, size = 64 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Bars */}
      <rect x="12" y="38" width="8" height="18" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="24" y="30" width="8" height="26" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="36" y="22" width="8" height="34" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="48" y="14" width="8" height="42" rx="2" fill="currentColor" opacity="0.9" />
      {/* Base line */}
      <line x1="8" y1="56" x2="60" y2="56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Small music note */}
      <ellipse cx="52" cy="10" rx="3" ry="2" fill="currentColor" transform="rotate(-15 52 10)" />
      <line x1="55" y1="4" x2="55" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Map exercise IDs to their icon components */
export const EXERCISE_ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  'note-finder': NoteFinderIcon,
  'staff-reader': StaffReaderIcon,
  'sharp-flat': SharpFlatIcon,
  'keyboard-note-id': FreePlayIcon, // reuse piano keys icon
  'key-signature-id': SharpFlatIcon, // reuse sharp/flat icon
  'interval-jump': IntervalIcon,
  'keyboard-interval-id': IntervalIcon, // reuse interval icon
  'chord-builder': ChordIcon,
  'keyboard-chord-id': ChordIcon, // reuse chord icon
  'scale-id': StaffReaderIcon, // reuse staff icon
  'ear-training': EarTrainingIcon,
  'ear-interval': EarTrainingIcon, // reuse ear icon
  'ear-chord': EarTrainingIcon, // reuse ear icon
  'rhythm-training': NoteFinderIcon, // reuse note icon
  'free-play': FreePlayIcon,
  'practice-stats': StatsIcon,
}
