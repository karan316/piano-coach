// MIDI ↔ Note name conversion, frequencies, and note metadata

export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Accidental = '' | '#' | 'b'

export interface NoteInfo {
  midi: number
  name: string // e.g. "C4", "F#3", "Bb5"
  letter: NoteLetter
  accidental: Accidental
  octave: number
  isBlack: boolean
  frequency: number
}

// The 12 chromatic note names (using sharps)
const SHARP_NAMES: string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
]

// Flat equivalents for display
const FLAT_NAMES: string[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F',
  'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
]

// Which chromatic indices are black keys (1-indexed semitone within octave)
const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]) // C#, D#, F#, G#, A#

// Computer keyboard to MIDI note mapping (base octave 4 = middle C)
export const KEYBOARD_MAP: Record<string, number> = {
  a: 0, // C
  w: 1, // C#
  s: 2, // D
  e: 3, // D#
  d: 4, // E
  f: 5, // F
  t: 6, // F#
  g: 7, // G
  y: 8, // G#
  h: 9, // A
  u: 10, // A#
  j: 11, // B
  k: 12, // C (next octave)
  o: 13, // C#
  l: 14, // D
  p: 15, // D#
}

/** Convert a MIDI note number to a note name with octave (sharp convention) */
export function midiToNoteName(midi: number, preferFlats = false): string {
  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${names[noteIndex]}${octave}`
}

/** Convert a MIDI note number to full NoteInfo */
export function midiToNoteInfo(midi: number, preferFlats = false): NoteInfo {
  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  const fullName = names[noteIndex]

  let letter: NoteLetter
  let accidental: Accidental

  if (fullName.length === 1) {
    letter = fullName as NoteLetter
    accidental = ''
  } else if (fullName.endsWith('b')) {
    letter = fullName[0] as NoteLetter
    accidental = 'b'
  } else {
    letter = fullName[0] as NoteLetter
    accidental = '#'
  }

  return {
    midi,
    name: `${fullName}${octave}`,
    letter,
    accidental,
    octave,
    isBlack: BLACK_KEY_INDICES.has(noteIndex),
    frequency: noteFrequency(midi),
  }
}

/** Convert a note name string (e.g. "C4", "F#3", "Bb5") to MIDI number */
export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G])(#|b)?(-?\d+)$/)
  if (!match) throw new Error(`Invalid note name: ${name}`)

  const [, letterStr, acc, octStr] = match
  const octave = parseInt(octStr, 10)

  const letterIndex: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  }

  let noteIndex = letterIndex[letterStr]
  if (noteIndex === undefined) throw new Error(`Invalid note letter: ${letterStr}`)

  if (acc === '#') noteIndex += 1
  else if (acc === 'b') noteIndex -= 1

  return (octave + 1) * 12 + noteIndex
}

/** Calculate frequency for a MIDI note: 440 * 2^((n-69)/12) */
export function noteFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Check if a MIDI note number corresponds to a black key */
export function isBlackKey(midi: number): boolean {
  return BLACK_KEY_INDICES.has(midi % 12)
}

/** Get the note letter (without accidental or octave) for display */
export function midiToLetter(midi: number, preferFlats = false): string {
  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES
  return names[midi % 12]
}

/** Generate an array of MIDI note numbers for a range of octaves */
export function generateKeyRange(startOctave: number, numOctaves: number): number[] {
  const startMidi = (startOctave + 1) * 12 // C of startOctave
  const endMidi = startMidi + numOctaves * 12
  const keys: number[] = []
  for (let i = startMidi; i <= endMidi; i++) {
    keys.push(i)
  }
  return keys
}

/** All white key note names */
export const WHITE_KEYS: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/** All note names including accidentals (sharps) */
export const ALL_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** All note names including accidentals (flats) */
export const ALL_NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

/** Standard intervals by semitone distance */
export const INTERVAL_NAMES: Record<number, string> = {
  0: 'Unison',
  1: 'Minor 2nd',
  2: 'Major 2nd',
  3: 'Minor 3rd',
  4: 'Major 3rd',
  5: 'Perfect 4th',
  6: 'Tritone',
  7: 'Perfect 5th',
  8: 'Minor 6th',
  9: 'Major 6th',
  10: 'Minor 7th',
  11: 'Major 7th',
  12: 'Octave',
}

/** Get the display name for an accidental */
export function accidentalSymbol(acc: Accidental): string {
  if (acc === '#') return '♯'
  if (acc === 'b') return '♭'
  return ''
}

/** Format a note name for display with proper symbols (e.g. "F♯4") */
export function formatNoteDisplay(name: string): string {
  return name.replace('#', '♯').replace('b', '♭')
}

/**
 * Staff position for treble clef. Returns the number of half-steps
 * from the bottom line (E4) — positive is up, negative is down.
 * Each step = one line or space on the staff.
 */
export function staffPosition(midi: number): number {
  // Map MIDI to staff position relative to middle C (C4 = MIDI 60)
  // In treble clef: bottom line = E4 (MIDI 64), each line/space = diatonic step
  const noteIndex = midi % 12
  const octave = Math.floor(midi / 12) - 1

  // Diatonic position within an octave (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
  const chromaticToDiatonic: Record<number, number> = {
    0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 3,
    6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 6,
  }

  const diatonicInOctave = chromaticToDiatonic[noteIndex]
  const diatonicAbsolute = octave * 7 + diatonicInOctave

  // E4 = octave 4, diatonic 2 → absolute = 4*7 + 2 = 30
  const e4Absolute = 4 * 7 + 2
  return diatonicAbsolute - e4Absolute
}
