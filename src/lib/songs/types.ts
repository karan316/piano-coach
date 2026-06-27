// Internal song format for the Song Player.
//
// This is a deliberately simple, beat-based, MIDI-like representation. It is the
// single format both player views (piano roll + sheet music) consume, and it is
// the intended target for the future AI audio-to-notation pipeline. Times are in
// BEATS (not seconds) so tempo scaling is trivial: seconds = beats * 60 / bpm.

export type Hand = 'left' | 'right'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface SongNote {
  /** MIDI pitch number (60 = middle C / C4) */
  midi: number
  /** Start time in beats from the beginning of the song */
  start: number
  /** Length of the note in beats */
  duration: number
  /** Which hand plays it — drives piano-roll color + sheet-music clef assignment */
  hand: Hand
  /** Optional fingering (1 = thumb ... 5 = pinky). Reserved for future use. */
  finger?: 1 | 2 | 3 | 4 | 5
}

export interface Song {
  id: string
  title: string
  composer: string
  difficulty: Difficulty
  /** Tempo in beats per minute */
  bpm: number
  /** [beats per bar, beat unit] e.g. [4, 4] */
  timeSignature: [number, number]
  /** Tonal center, e.g. 'C', 'Am', 'G'. Used by the sheet view for the key signature. */
  keySignature: string
  /** Flat list of all notes (both hands), sorted by start time. */
  notes: SongNote[]
}

/** A single musical piece offered at three difficulty levels. */
export interface SongPiece {
  id: string
  title: string
  composer: string
  /** Short blurb shown on the library card */
  blurb: string
  variants: Record<Difficulty, Song>
}

/** Total length of a song in beats (end of the last note). */
export function songDurationBeats(song: Song): number {
  let end = 0
  for (const n of song.notes) {
    const e = n.start + n.duration
    if (e > end) end = e
  }
  return end
}

/** Total length of a song in seconds at its nominal tempo. */
export function songDurationSeconds(song: Song): number {
  return (songDurationBeats(song) * 60) / song.bpm
}

/** Number of bars in a song (rounded up). */
export function songBarCount(song: Song): number {
  const beatsPerBar = song.timeSignature[0]
  return Math.ceil(songDurationBeats(song) / beatsPerBar)
}
