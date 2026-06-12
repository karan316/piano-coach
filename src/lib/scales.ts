// Scale definitions and key signature data

import { noteNameToMidi, midiToLetter } from './notes'

// ─── Scale Definitions ────────────────────────────────────────────────

export interface ScaleDefinition {
  name: string
  intervals: number[] // semitone intervals from root
  type: 'major' | 'minor' | 'other'
}

export const SCALE_TYPES: ScaleDefinition[] = [
  { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11], type: 'major' },
  { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10], type: 'minor' },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11], type: 'minor' },
]

/** Get MIDI note numbers for a scale starting at a given root */
export function getScaleNotes(rootMidi: number, scale: ScaleDefinition): number[] {
  return scale.intervals.map((i) => rootMidi + i)
}

/** Get the note names for a scale */
export function getScaleNoteNames(rootNote: string, scale: ScaleDefinition): string[] {
  const rootMidi = noteNameToMidi(`${rootNote}4`)
  return scale.intervals.map((i) => midiToLetter(rootMidi + i))
}

/** Get a display name like "C Major" or "A Natural Minor" */
export function getScaleDisplayName(rootNote: string, scale: ScaleDefinition): string {
  return `${rootNote} ${scale.name}`
}

// ─── Key Signature Definitions ────────────────────────────────────────

export interface KeySignature {
  key: string // e.g. "C Major", "G Major"
  type: 'major' | 'minor'
  sharps: string[] // sharp note names in order
  flats: string[] // flat note names in order
}

// Key signatures ordered by circle of fifths
export const KEY_SIGNATURES: KeySignature[] = [
  // Sharps
  { key: 'C Major', type: 'major', sharps: [], flats: [] },
  { key: 'G Major', type: 'major', sharps: ['F'], flats: [] },
  { key: 'D Major', type: 'major', sharps: ['F', 'C'], flats: [] },
  { key: 'A Major', type: 'major', sharps: ['F', 'C', 'G'], flats: [] },
  { key: 'E Major', type: 'major', sharps: ['F', 'C', 'G', 'D'], flats: [] },
  { key: 'B Major', type: 'major', sharps: ['F', 'C', 'G', 'D', 'A'], flats: [] },
  { key: 'F# Major', type: 'major', sharps: ['F', 'C', 'G', 'D', 'A', 'E'], flats: [] },
  // Flats
  { key: 'F Major', type: 'major', sharps: [], flats: ['B'] },
  { key: 'Bb Major', type: 'major', sharps: [], flats: ['B', 'E'] },
  { key: 'Eb Major', type: 'major', sharps: [], flats: ['B', 'E', 'A'] },
  { key: 'Ab Major', type: 'major', sharps: [], flats: ['B', 'E', 'A', 'D'] },
  { key: 'Db Major', type: 'major', sharps: [], flats: ['B', 'E', 'A', 'D', 'G'] },
]

/** Get a random key signature, optionally limited to a max number of accidentals */
export function getRandomKeySignature(maxAccidentals = 7): KeySignature {
  const filtered = KEY_SIGNATURES.filter(
    (ks) => ks.sharps.length + ks.flats.length <= maxAccidentals,
  )
  return filtered[Math.floor(Math.random() * filtered.length)]
}

/** Generate 3 wrong key signature choices (distractors) */
export function getKeySignatureDistractors(correct: KeySignature, count = 3): KeySignature[] {
  const others = KEY_SIGNATURES.filter((ks) => ks.key !== correct.key)
  const shuffled = others.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// ─── Interval Helpers for Exercises ───────────────────────────────────

export const INTERVAL_LIST = [
  { semitones: 1, name: 'Minor 2nd' },
  { semitones: 2, name: 'Major 2nd' },
  { semitones: 3, name: 'Minor 3rd' },
  { semitones: 4, name: 'Major 3rd' },
  { semitones: 5, name: 'Perfect 4th' },
  { semitones: 6, name: 'Tritone' },
  { semitones: 7, name: 'Perfect 5th' },
  { semitones: 8, name: 'Minor 6th' },
  { semitones: 9, name: 'Major 6th' },
  { semitones: 10, name: 'Minor 7th' },
  { semitones: 11, name: 'Major 7th' },
  { semitones: 12, name: 'Octave' },
]

/** Get distractor interval names for a given correct interval */
export function getIntervalDistractors(correctSemitones: number, count = 3): string[] {
  const correct = INTERVAL_LIST.find((i) => i.semitones === correctSemitones)
  if (!correct) return []
  const others = INTERVAL_LIST.filter((i) => i.semitones !== correctSemitones)
  const shuffled = others.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((i) => i.name)
}

/** Get interval name from semitone distance */
export function getIntervalName(semitones: number): string {
  const abs = Math.abs(semitones) % 12
  return INTERVAL_LIST.find((i) => i.semitones === abs)?.name ?? `${abs} semitones`
}

// ─── Chord Identification Helpers ─────────────────────────────────────

export const CHORD_QUALITIES = ['Major', 'Minor', 'Diminished', 'Augmented'] as const
export type ChordQuality = (typeof CHORD_QUALITIES)[number]

/** Get distractor chord names for a given correct chord */
export function getChordDistractors(correctName: string, count = 3): string[] {
  // Generate plausible alternatives by changing root or quality
  const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const qualities = ['Major', 'Minor', 'Diminished']
  const all = roots.flatMap((r) => qualities.map((q) => `${r} ${q}`))
  const others = all.filter((n) => n !== correctName)
  const shuffled = others.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/** Get distractor scale names */
export function getScaleDistractors(correctName: string, count = 3): string[] {
  const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const types = ['Major', 'Natural Minor']
  const all = roots.flatMap((r) => types.map((t) => `${r} ${t}`))
  const others = all.filter((n) => n !== correctName)
  const shuffled = others.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
