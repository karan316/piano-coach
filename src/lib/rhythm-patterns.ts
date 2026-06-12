// Rhythm patterns for rhythm training exercise

import { noteNameToMidi } from './notes'

export interface RhythmNote {
  note: string // e.g. "C4"
  midi: number
  /** Duration in beats (1 = quarter note, 2 = half, 4 = whole, 0.5 = eighth) */
  duration: number
  /** Beat position in the pattern */
  beatPosition: number
}

export interface RhythmPattern {
  name: string
  bpm: number
  timeSignature: [number, number] // [beats per measure, beat unit]
  notes: RhythmNote[]
  totalBeats: number
}

/** Generate a simple rhythm pattern for beginners */
export function generateRhythmPattern(difficulty: 'easy' | 'medium' | 'hard', octave: number): RhythmPattern {
  const noteNames = ['C', 'D', 'E', 'F', 'G']

  if (difficulty === 'easy') {
    // 4 whole notes (4 beats each = 16 beats total at slow tempo)
    const notes: RhythmNote[] = []
    for (let i = 0; i < 4; i++) {
      const name = noteNames[Math.floor(Math.random() * noteNames.length)]
      const noteWithOctave = `${name}${octave}`
      notes.push({
        note: noteWithOctave,
        midi: noteNameToMidi(noteWithOctave),
        duration: 4,
        beatPosition: i * 4,
      })
    }
    return { name: 'Whole Notes', bpm: 60, timeSignature: [4, 4], notes, totalBeats: 16 }
  }

  if (difficulty === 'medium') {
    // 8 half notes (2 beats each = 16 beats)
    const notes: RhythmNote[] = []
    for (let i = 0; i < 8; i++) {
      const name = noteNames[Math.floor(Math.random() * noteNames.length)]
      const noteWithOctave = `${name}${octave}`
      notes.push({
        note: noteWithOctave,
        midi: noteNameToMidi(noteWithOctave),
        duration: 2,
        beatPosition: i * 2,
      })
    }
    return { name: 'Half Notes', bpm: 70, timeSignature: [4, 4], notes, totalBeats: 16 }
  }

  // Hard: mix of quarter notes
  const notes: RhythmNote[] = []
  for (let i = 0; i < 16; i++) {
    const name = noteNames[Math.floor(Math.random() * noteNames.length)]
    const noteWithOctave = `${name}${octave}`
    notes.push({
      note: noteWithOctave,
      midi: noteNameToMidi(noteWithOctave),
      duration: 1,
      beatPosition: i,
    })
  }
  return { name: 'Quarter Notes', bpm: 80, timeSignature: [4, 4], notes, totalBeats: 16 }
}

/** Check if a note was played within the timing window */
export function checkTiming(
  expectedBeatTime: number,
  actualTime: number,
  bpm: number,
): 'perfect' | 'good' | 'late' | 'early' | 'miss' {
  const msPerBeat = 60000 / bpm
  const diff = actualTime - expectedBeatTime

  if (Math.abs(diff) <= msPerBeat * 0.1) return 'perfect' // within 10% of beat
  if (Math.abs(diff) <= msPerBeat * 0.25) return 'good' // within 25%
  if (diff > 0 && diff <= msPerBeat * 0.5) return 'late'
  if (diff < 0 && Math.abs(diff) <= msPerBeat * 0.5) return 'early'
  return 'miss'
}
