// Exercise configs, adaptive note selection, chord detection, scoring

import type { NoteLetter } from './notes';
import {
    ALL_NOTES_SHARP,
    INTERVAL_NAMES,
    midiToLetter,
    midiToNoteName,
    noteNameToMidi,
    WHITE_KEYS
} from './notes';
import type { PracticeStats } from './practice-store';
import { getKeySignatureDistractors, getRandomKeySignature } from './scales';

// ─── Exercise Definitions ─────────────────────────────────────────────

export interface ExerciseConfig {
  id: string
  name: string
  description: string
  level: 'beginner' | 'beginner+' | 'intermediate' | 'intermediate+'| 'all'
  notePool: string[] // Note names without octave (e.g. ['C', 'D', 'E'])
  showStaff: boolean
  type: 'single' | 'interval' | 'chord' | 'ear' | 'multiple-choice' | 'rhythm'
  /** Category for grouping in the exercise grid */
  category: 'notes' | 'intervals' | 'ear' | 'rhythm' | 'tools'
}

export const EXERCISES: ExerciseConfig[] = [
  // ─── Note Reading ───────────────────────────────────────────
  {
    id: 'note-finder',
    name: 'Note Finder',
    description: 'Find the right key for the displayed note',
    level: 'beginner',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'single',
    category: 'notes',
  },
  {
    id: 'staff-reader',
    name: 'Staff Reader',
    description: 'Read notes from the musical staff',
    level: 'beginner',
    notePool: [...WHITE_KEYS],
    showStaff: true,
    type: 'single',
    category: 'notes',
  },
  {
    id: 'sharp-flat',
    name: 'Sharp & Flat',
    description: 'Master the black keys with sharps and flats',
    level: 'beginner+',
    notePool: [...ALL_NOTES_SHARP],
    showStaff: true,
    type: 'single',
    category: 'notes',
  },
  {
    id: 'keyboard-note-id',
    name: 'Key Identifier',
    description: 'Name the highlighted key on the keyboard',
    level: 'beginner',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'multiple-choice',
    category: 'notes',
  },
  {
    id: 'key-signature-id',
    name: 'Key Signatures',
    description: 'Identify key signatures from the staff',
    level: 'intermediate',
    notePool: [],
    showStaff: true,
    type: 'multiple-choice',
    category: 'notes',
  },
  // ─── Intervals & Chords ─────────────────────────────────────
  {
    id: 'interval-jump',
    name: 'Interval Jump',
    description: 'Play two notes in sequence to learn intervals',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: true,
    type: 'interval',
    category: 'intervals',
  },
  {
    id: 'keyboard-interval-id',
    name: 'Interval Identifier',
    description: 'Name the interval between two highlighted keys',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'multiple-choice',
    category: 'intervals',
  },
  {
    id: 'chord-builder',
    name: 'Chord Builder',
    description: 'Play chords and learn major, minor, and more',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: true,
    type: 'chord',
    category: 'intervals',
  },
  {
    id: 'keyboard-chord-id',
    name: 'Chord Identifier',
    description: 'Name the chord shown on the keyboard',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'multiple-choice',
    category: 'intervals',
  },
  {
    id: 'scale-id',
    name: 'Scale Identifier',
    description: 'Identify scales from highlighted keys',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'multiple-choice',
    category: 'intervals',
  },
  // ─── Ear Training ───────────────────────────────────────────
  {
    id: 'ear-training',
    name: 'Ear Training',
    description: 'Listen to a note and play it back',
    level: 'intermediate+',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'ear',
    category: 'ear',
  },
  {
    id: 'ear-interval',
    name: 'Interval by Ear',
    description: 'Identify intervals by listening',
    level: 'intermediate+',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'multiple-choice',
    category: 'ear',
  },
  {
    id: 'ear-chord',
    name: 'Chord by Ear',
    description: 'Identify chord types by listening',
    level: 'intermediate+',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'multiple-choice',
    category: 'ear',
  },
  {
    id: 'ear-scale',
    name: 'Scale by Ear',
    description: 'Identify scales by listening',
    level: 'intermediate+',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'multiple-choice',
    category: 'ear',
  },
  // ─── Rhythm ─────────────────────────────────────────────────
  {
    id: 'rhythm-training',
    name: 'Rhythm Training',
    description: 'Play notes in time with the beat',
    level: 'intermediate',
    notePool: [...WHITE_KEYS],
    showStaff: false,
    type: 'rhythm',
    category: 'rhythm',
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

// ─── Multiple Choice Exercise Generation ──────────────────────────────

export interface MultipleChoiceQuestion {
  id: string // exercise id that generated this
  prompt: string // what to display/ask
  choices: string[] // 4 shuffled options
  correctAnswer: string
  /** MIDI notes to highlight on keyboard (for keyboard-based exercises) */
  highlightKeys?: number[]
  /** MIDI notes to play (for ear-based exercises) */
  playNotes?: number[]
  /** Whether to play notes simultaneously (chord) or sequentially (interval) */
  playSimultaneous?: boolean
  /** Key signature data for key-signature-id exercise */
  keySigSharps?: string[]
  keySigFlats?: string[]
}

/** Shuffle an array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Generate a multiple-choice question for a given exercise */
export function generateMultipleChoice(exerciseId: string, octave: number, numOctaves = 2): MultipleChoiceQuestion {
  const minMidi = (octave + 1) * 12 // C of startOctave
  const maxMidi = minMidi + numOctaves * 12 // top of range

  /** Pick a random MIDI note within the visible keyboard range */
  function randomMidiInRange(): number {
    return minMidi + Math.floor(Math.random() * (maxMidi - minMidi))
  }

  switch (exerciseId) {
    case 'keyboard-note-id': {
      const midi = randomMidiInRange()
      const note = midiToLetter(midi)
      const notes = [...WHITE_KEYS, 'C#', 'D#', 'F#', 'G#', 'A#']
      const distractors = shuffle(notes.filter((n) => n !== note)).slice(0, 3)
      return {
        id: exerciseId,
        prompt: 'What note is this?',
        choices: shuffle([note, ...distractors]),
        correctAnswer: note,
        highlightKeys: [midi],
      }
    }

    case 'keyboard-interval-id': {
      const rootMidi = minMidi + Math.floor(Math.random() * (maxMidi - minMidi - 12)) // leave room for interval
      const possibleIntervals = [2, 3, 4, 5, 7, 8, 9, 12].filter((i) => rootMidi + i <= maxMidi)
      const semitones = possibleIntervals[Math.floor(Math.random() * possibleIntervals.length)]
      const secondMidi = rootMidi + semitones
      const correctName = INTERVAL_NAMES[semitones] ?? `${semitones} semitones`
      const otherIntervals = possibleIntervals.filter((i) => i !== semitones)
      const distractors = shuffle(otherIntervals).slice(0, 3).map((i) => INTERVAL_NAMES[i] ?? `${i}`)
      return {
        id: exerciseId,
        prompt: 'What interval is this?',
        choices: shuffle([correctName, ...distractors]),
        correctAnswer: correctName,
        highlightKeys: [rootMidi, secondMidi],
      }
    }

    case 'keyboard-chord-id': {
      // Pick a root that leaves room for the chord (7 semitones)
      const rootMidi = minMidi + Math.floor(Math.random() * (maxMidi - minMidi - 7))
      const root = midiToLetter(rootMidi)
      const isMajor = Math.random() > 0.4
      const thirdMidi = rootMidi + (isMajor ? 4 : 3)
      const fifthMidi = rootMidi + 7
      const quality = isMajor ? 'Major' : 'Minor'
      const correctName = `${root} ${quality}`
      const chordRoots: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const allChords = chordRoots.flatMap((r) => [`${r} Major`, `${r} Minor`])
      const distractors = shuffle(allChords.filter((c) => c !== correctName)).slice(0, 3)
      return {
        id: exerciseId,
        prompt: 'What chord is this?',
        choices: shuffle([correctName, ...distractors]),
        correctAnswer: correctName,
        highlightKeys: [rootMidi, thirdMidi, fifthMidi],
      }
    }

    case 'scale-id': {
      // Pick a root that leaves room for the full scale (11 semitones)
      const rootMidi = minMidi + Math.floor(Math.random() * (maxMidi - minMidi - 11))
      const root = midiToLetter(rootMidi)
      const isMajor = Math.random() > 0.4
      const intervals = isMajor ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10]
      const scaleMidis = intervals.map((i) => rootMidi + i)
      const quality = isMajor ? 'Major' : 'Natural Minor'
      const correctName = `${root} ${quality}`
      const scaleRoots: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const allScales = scaleRoots.flatMap((r) => [`${r} Major`, `${r} Natural Minor`])
      const distractors = shuffle(allScales.filter((s) => s !== correctName)).slice(0, 3)
      return {
        id: exerciseId,
        prompt: 'What scale is this?',
        choices: shuffle([correctName, ...distractors]),
        correctAnswer: correctName,
        highlightKeys: scaleMidis,
      }
    }

    case 'key-signature-id': {
      const keySig = getRandomKeySignature(4) // limit to 4 accidentals for now
      const distractors = getKeySignatureDistractors(keySig, 3)
      return {
        id: exerciseId,
        prompt: 'What key signature is this?',
        choices: shuffle([keySig.key, ...distractors.map((d) => d.key)]),
        correctAnswer: keySig.key,        keySigSharps: keySig.sharps,
        keySigFlats: keySig.flats,      }
    }

    case 'ear-interval': {
      const root = WHITE_KEYS[Math.floor(Math.random() * WHITE_KEYS.length)]
      const rootMidi = noteNameToMidi(`${root}${octave}`)
      const possibleIntervals = [3, 4, 5, 7, 8, 12] // easier intervals first
      const semitones = possibleIntervals[Math.floor(Math.random() * possibleIntervals.length)]
      const secondMidi = rootMidi + semitones
      const correctName = INTERVAL_NAMES[semitones] ?? `${semitones} semitones`
      const otherIntervals = possibleIntervals.filter((i) => i !== semitones)
      const distractors = shuffle(otherIntervals).slice(0, 3).map((i) => INTERVAL_NAMES[i] ?? `${i}`)
      return {
        id: exerciseId,
        prompt: 'What interval do you hear?',
        choices: shuffle([correctName, ...distractors]),
        correctAnswer: correctName,
        playNotes: [rootMidi, secondMidi],
        playSimultaneous: false,
      }
    }

    case 'ear-chord': {
      const roots: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A']
      const root = roots[Math.floor(Math.random() * roots.length)]
      const rootMidi = noteNameToMidi(`${root}${octave}`)
      const qualities = ['Major', 'Minor', 'Diminished'] as const
      const quality = qualities[Math.floor(Math.random() * qualities.length)]
      const third = quality === 'Major' ? 4 : 3
      const fifth = quality === 'Diminished' ? 6 : 7
      const chordMidis = [rootMidi, rootMidi + third, rootMidi + fifth]
      return {
        id: exerciseId,
        prompt: 'What type of chord do you hear?',
        choices: shuffle(['Major', 'Minor', 'Diminished']),
        correctAnswer: quality,
        playNotes: chordMidis,
        playSimultaneous: true,
      }
    }

    case 'ear-scale': {
      const roots: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A']
      const root = roots[Math.floor(Math.random() * roots.length)]
      const rootMidi = noteNameToMidi(`${root}${octave}`)
      const isMajor = Math.random() > 0.4
      const intervals = isMajor ? [0, 2, 4, 5, 7, 9, 11, 12] : [0, 2, 3, 5, 7, 8, 10, 12]
      const scaleMidis = intervals.map((i) => rootMidi + i)
      const quality = isMajor ? 'Major' : 'Natural Minor'
      const correctName = `${root} ${quality}`
      const scaleRoots: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const allScales = scaleRoots.flatMap((r) => [`${r} Major`, `${r} Natural Minor`])
      const distractors = shuffle(allScales.filter((s) => s !== correctName)).slice(0, 3)
      return {
        id: exerciseId,
        prompt: 'What scale do you hear?',
        choices: shuffle([correctName, ...distractors]),
        correctAnswer: correctName,
        playNotes: scaleMidis,
        playSimultaneous: false, // play ascending
      }
    }

    default:
      return {
        id: exerciseId,
        prompt: 'Unknown exercise',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
      }
  }
}
