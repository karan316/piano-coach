// Exercise configs, adaptive note selection, chord detection, scoring

import {
  type NoteLetter,
  WHITE_KEYS,
  ALL_NOTES_SHARP,
  ALL_NOTES_FLAT,
  INTERVAL_NAMES,
  noteNameToMidi,
  midiToLetter,
  midiToNoteName,
} from './notes'
import type { PracticeStats } from './practice-store'

// ─── Exercise Definitions ─────────────────────────────────────────────

export interface ExerciseConfig {
  id: string
  name: string
  description: string
  level: 'beginner' | 'beginner+' | 'intermediate' | 'intermediate+'| 'all'
  notePool: string[] // Note names without octave (e.g. ['C', 'D', 'E'])
  showStaff: boolean
  type: 'single' | 'interval' | 'chord' | 'ear'
}

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'note-finder',
    name: 'Note Finder',
    description: 'Find the right key for the displayed note',
    level: 'beginner',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'single',
  },
  {
    id: 'staff-reader',
    name: 'Staff Reader',
    description: 'Read notes from the musical staff',
    level: 'beginner',
    notePool: [...WHITE_KEYS],
    showStaff: true,
    type: 'single',
  },
  {
    id: 'sharp-flat',
    name: 'Sharp & Flat',
    description: 'Master the black keys with sharps and flats',
    level: 'beginner+',
    notePool: [...ALL_NOTES_SHARP],
    showStaff: true,
    type: 'single',
  },
  {
    id: 'interval-jump',
    name: 'Interval Jump',
    description: 'Play two notes in sequence to learn intervals',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: true,
    type: 'interval',
  },
  {
    id: 'chord-builder',
    name: 'Chord Builder',
    description: 'Play chords and learn what makes them major, minor, and more',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: true,
    type: 'chord',
  },
  {
    id: 'ear-training',
    name: 'Ear Training',
    description: 'Listen to a note and play it back',
    level: 'intermediate+',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'ear',
  },
]

export function getExercise(id: string): ExerciseConfig | undefined {
  return EXERCISES.find((e) => e.id === id)
}

// ─── Adaptive Note Selection ──────────────────────────────────────────

/**
 * Select the next note to prompt, weighted by weakness.
 * Notes the user is slow or inaccurate on appear more often.
 */
export function selectNextNote(
  notePool: string[],
  stats: PracticeStats | null,
  previousNote?: string,
): string {
  if (!stats || stats.totalAttempts < 5) {
    // Not enough data, pick randomly (avoid repeating previous)
    const filtered = previousNote ? notePool.filter((n) => n !== previousNote) : notePool
    const pool = filtered.length > 0 ? filtered : notePool
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // Build weights: higher weight = more likely to appear
  const weights = notePool.map((note) => {
    const noteStats = stats.byNote.find((ns) => ns.note === note)
    if (!noteStats || noteStats.attempts < 2) return 2 // Unknown notes get moderate weight

    let weight = 1
    // Low accuracy → higher weight
    if (noteStats.accuracy < 0.5) weight += 4
    else if (noteStats.accuracy < 0.7) weight += 2
    else if (noteStats.accuracy < 0.9) weight += 1

    // Slow reaction → higher weight
    if (noteStats.avgReactionMs > 3000) weight += 3
    else if (noteStats.avgReactionMs > 2000) weight += 1

    // Penalize repeating previous note
    if (note === previousNote) weight = Math.max(1, weight - 2)

    return weight
  })

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  for (let i = 0; i < notePool.length; i++) {
    random -= weights[i]
    if (random <= 0) return notePool[i]
  }

  return notePool[notePool.length - 1]
}

// ─── Interval Generation ──────────────────────────────────────────────

export interface IntervalPrompt {
  note1: string // With octave e.g. "C4"
  note2: string
  intervalName: string
  semitones: number
}

/** Generate a random interval prompt from the note pool */
export function generateInterval(notePool: string[], octave: number): IntervalPrompt {
  const idx1 = Math.floor(Math.random() * notePool.length)
  let idx2 = Math.floor(Math.random() * notePool.length)
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * notePool.length)
  }

  const note1 = `${notePool[idx1]}${octave}`
  const note2 = `${notePool[idx2]}${octave}`

  const midi1 = noteNameToMidi(note1)
  const midi2 = noteNameToMidi(note2)
  const semitones = Math.abs(midi2 - midi1) % 12

  return {
    note1,
    note2,
    intervalName: INTERVAL_NAMES[semitones] ?? `${semitones} semitones`,
    semitones,
  }
}

// ─── Chord Detection & Generation ─────────────────────────────────────

export interface ChordInfo {
  name: string // e.g. "C Major"
  root: string // e.g. "C"
  quality: 'major' | 'minor' | 'diminished' | 'augmented' | 'unknown'
  description: string // Fun educational description
  notes: string[] // e.g. ["C", "E", "G"]
}

/** Common chord patterns (semitone intervals from root) */
const CHORD_PATTERNS: { intervals: number[]; quality: ChordInfo['quality']; suffix: string; description: string }[] = [
  {
    intervals: [0, 4, 7],
    quality: 'major',
    suffix: 'Major',
    description: 'Major chords sound happy and bright! 🌟',
  },
  {
    intervals: [0, 3, 7],
    quality: 'minor',
    suffix: 'Minor',
    description: 'Minor chords sound sad and emotional. 🌙',
  },
  {
    intervals: [0, 3, 6],
    quality: 'diminished',
    suffix: 'Diminished',
    description: 'Diminished chords sound tense and mysterious! 🔮',
  },
  {
    intervals: [0, 4, 8],
    quality: 'augmented',
    suffix: 'Augmented',
    description: 'Augmented chords sound dreamy and unresolved. ✨',
  },
]

/** Detect what chord is formed by a set of MIDI notes */
export function detectChord(midiNotes: number[]): ChordInfo | null {
  if (midiNotes.length < 3) return null

  // Normalize to pitch classes (0-11) and sort
  const pitchClasses = [...new Set(midiNotes.map((n) => n % 12))].sort((a, b) => a - b)
  if (pitchClasses.length < 3) return null

  // Try each pitch class as potential root
  for (const root of pitchClasses) {
    const intervals = pitchClasses.map((pc) => (pc - root + 12) % 12).sort((a, b) => a - b)

    for (const pattern of CHORD_PATTERNS) {
      if (
        intervals.length === pattern.intervals.length &&
        intervals.every((v, i) => v === pattern.intervals[i])
      ) {
        const rootName = midiToLetter(root + 60) // Use octave 4 as reference
        return {
          name: `${rootName} ${pattern.suffix}`,
          root: rootName,
          quality: pattern.quality,
          description: pattern.description,
          notes: pattern.intervals.map((i) => midiToLetter((root + i) % 12 + 60)),
        }
      }
    }
  }

  return null
}

/** Generate a chord prompt for the user to play */
export function generateChordPrompt(octave: number): {
  notes: string[] // e.g. ["C4", "E4", "G4"]
  chord: ChordInfo
} {
  // Pick a random root from white keys
  const roots: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A']
  const root = roots[Math.floor(Math.random() * roots.length)]

  // Pick major or minor randomly (simpler for beginners)
  const isMajor = Math.random() > 0.4

  const rootMidi = noteNameToMidi(`${root}${octave}`)
  const thirdMidi = rootMidi + (isMajor ? 4 : 3)
  const fifthMidi = rootMidi + 7

  const notes = [rootMidi, thirdMidi, fifthMidi].map((m) => midiToNoteName(m))
  const chord = detectChord([rootMidi, thirdMidi, fifthMidi])!

  return { notes, chord }
}

// ─── Answer Checking ──────────────────────────────────────────────────

/** Check if a played MIDI note matches the prompted note name (ignoring octave) */
export function checkNoteMatch(playedMidi: number, promptNoteName: string): boolean {
  const playedLetter = midiToLetter(playedMidi)
  // Also check flat equivalent
  const playedLetterFlat = midiToLetter(playedMidi, true)
  return playedLetter === promptNoteName || playedLetterFlat === promptNoteName
}

/** Check if played MIDI note matches exactly (including octave) */
export function checkExactMatch(playedMidi: number, promptNoteName: string): boolean {
  const playedName = midiToNoteName(playedMidi)
  const playedNameFlat = midiToNoteName(playedMidi, true)
  return playedName === promptNoteName || playedNameFlat === promptNoteName
}

/** Check if a set of MIDI notes matches a chord prompt */
export function checkChordMatch(playedMidis: number[], promptNotes: string[]): boolean {
  const playedPitchClasses = new Set(playedMidis.map((m) => m % 12))
  const promptPitchClasses = new Set(promptNotes.map((n) => noteNameToMidi(n) % 12))

  if (playedPitchClasses.size < promptPitchClasses.size) return false

  for (const pc of promptPitchClasses) {
    if (!playedPitchClasses.has(pc)) return false
  }
  return true
}

// ─── Ear Training ─────────────────────────────────────────────────────

/** Generate a note for ear training */
export function generateEarTrainingNote(notePool: string[], octave: number): string {
  const note = notePool[Math.floor(Math.random() * notePool.length)]
  return `${note}${octave}`
}
