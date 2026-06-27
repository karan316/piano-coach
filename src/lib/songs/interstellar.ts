// "Day One (Interstellar)" — Hans Zimmer.
// Transcribed from the virtualpiano.net music sheet, which maps computer-
// keyboard keys to piano keys. We decode that mapping and parse the sheet
// directly into our note format. The signature is a relentless repeated E
// (the key 'u' = E4) with chords whose roots climb underneath.
//
// VP key map (lowercase): 1..7 = C2..B2, 8 9 0 = C3 D3 E3,
//   q w e r = F3 G3 A3 B3, t y u i o p a = C4 D4 E4 F4 G4 A4 B4,
//   s d f g h j k = C5 D5 E5 F5 G5 A5 B5, l z x c v b n = C6 D6 E6 F6 G6 A6 B6,
//   m = C7. (Uppercase/symbols are the sharps, unused here.)

import { noteNameToMidi } from '../notes'
import type { Hand, Song, SongNote, SongPiece } from './types'

const M = (n: string) => noteNameToMidi(n)

const VP_NOTE: Record<string, number> = {
  '1': M('C2'), '2': M('D2'), '3': M('E2'), '4': M('F2'), '5': M('G2'), '6': M('A2'), '7': M('B2'),
  '8': M('C3'), '9': M('D3'), '0': M('E3'),
  q: M('F3'), w: M('G3'), e: M('A3'), r: M('B3'),
  t: M('C4'), y: M('D4'), u: M('E4'), i: M('F4'), o: M('G4'), p: M('A4'), a: M('B4'),
  s: M('C5'), d: M('D5'), f: M('E5'), g: M('F5'), h: M('G5'), j: M('A5'), k: M('B5'),
  l: M('C6'), z: M('D6'), x: M('E6'), c: M('F6'), v: M('G6'), b: M('A6'), n: M('B6'),
  m: M('C7'),
}

function sortNotes(notes: SongNote[]): SongNote[] {
  return [...notes].sort((a, b) => a.start - b.start || a.midi - b.midi)
}

const HAND_SPLIT = 61 // notes below C#4 are the left hand (bass / roots)
const handOf = (midi: number): Hand => (midi < HAND_SPLIT ? 'left' : 'right')

/**
 * Parse a virtualpiano.net sheet into timed notes.
 * - `[abc]` = notes struck together (a chord), split across hands by pitch.
 * - Space-separated lines are fast runs (sixteenth notes); otherwise eighths.
 * - `|` is a separator; two or more in a row insert a rest.
 */
function parseVP(sheet: string, startBeat = 0): { notes: SongNote[]; end: number } {
  const notes: SongNote[] = []
  let time = startBeat

  for (const rawLine of sheet.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const step = line.includes(' ') ? 0.25 : 0.5
    let i = 0
    let pipes = 0

    const flushRest = () => {
      if (pipes >= 2) time += (pipes - 1) * step
      pipes = 0
    }

    while (i < line.length) {
      const ch = line[i]
      if (ch === '|') { pipes++; i++; continue }
      if (ch === ' ') { i++; continue }

      if (ch === '[') {
        flushRest()
        const close = line.indexOf(']', i)
        const end = close === -1 ? line.length : close
        for (const c of line.slice(i + 1, end)) {
          const midi = VP_NOTE[c]
          if (midi !== undefined) {
            notes.push({ midi, start: time, duration: step, hand: handOf(midi) })
          }
        }
        time += step
        i = end + 1
      } else {
        flushRest()
        const midi = VP_NOTE[ch]
        if (midi !== undefined) {
          notes.push({ midi, start: time, duration: step, hand: handOf(midi) })
          time += step
        }
        i++
      }
    }
  }

  return { notes, end: time }
}

// ─── The virtualpiano.net "Day One" sheet, in sections ────────────────

// Intro: the repeated-E pulse with A–B–C chord stabs.
const SEG_INTRO = `
u|u|u|u|u|u|u|u|
[eup]|u|u|[rua]|u|u|u|u|u|
[eup]|[rua]|[tus]|[rua]|[eup]|[rua]|[tus]|u|u|
[rua]|u|u|u|u|u|
[eup]|u|[uf]|[tus]|u|u|
[rua]|u|u|u|u|u|
[eup]|[uf]|[tus]|[rua]|[eup]|[rua]|[tus]|u|u|
[rua]|u|u|u|u|u|
[eup]|[uf]|[tus]|[rua]|[eup]|[rua]|[tus]|u|u|
[yud]|u|u|[uf]|u|u|
`

// Fast melodic runs (sixteenth notes) over the pulse.
const SEG_RUNS = `
[eup] a [us] a [up] s
[rua] p [uo] p [ua] o [ua] p [uo] p [ua] o
[eup] s [rua] d [tus] p [rua] o
[eup] s [rua] d [tus] d [us] a [up] s
[rua] p [uo] p [ua] o [ua] p [uo] f [ua] o
[eup] a [us] a [uf] a [tus] d [us] a [up] s
[rua] p [uo] p [ua] o [ua] p [uo] f [ua] o
[eup] s [uf] a [tus] p [rua] o
[eup] s [rua] d [tus] a [up] a [us] p
[yud] s [ua] s [ud] a
`

// The high-E octave pulse with the bass moving F–G–A–G.
const SEG_OCTAVE = `
[uf]|[uf]|[uf]|[uf]|[uf]|[uf]|[uf]|[uf]|
[qup]|[uf]|u|[up]|[uf]|u|
[wua]|[uf]|u|[ua]|[uf]|u|
[eus]|[uf]|u|[us]|[uf]|u|
[wud]|[uf]|u|[ud]|[uf]|[ua]|
`

// Climax: low bass octaves with fast right-hand figuration.
const SEG_CLIMAX = `
[4qup] f [uf] f u f [up] f [uf] f u f
[5wua] f [uf] f u f [ua] f [uf] f u f
[6eus] f [uf] f u f [us] f [uf] f u f
[5wud] f [uf] f u f [ud] f [uf] f u f
`

// Ending: big sustained chords.
const SEG_ENDING = `
[4pj]|[fx]||[pj]|[fx]||
[5ak]|[fx]||[ak]|[fx]||
[6sl]|[fx]||[sl]|[fx]||
[5dz]|[fx]||[dz]|[fx]|a|
[4e]|f||e|f||
[5r]|f||r|f||
[6t]|f||t|f||
[5y]|f||y|f|a|[3uf]
`

function parseAll(...segments: string[]): SongNote[] {
  const notes: SongNote[] = []
  let t = 0
  for (const seg of segments) {
    const { notes: segNotes, end } = parseVP(seg, t)
    notes.push(...segNotes)
    t = Math.ceil(end) + 1 // snap to a bar-ish boundary, small breath between sections
  }
  return sortNotes(notes)
}

/**
 * Thin out rapidly repeated strikes of a single pitch (the E pulse). Any strike
 * that falls within `minGap` beats of the previous kept one is dropped, so the
 * relentless E plays roughly half as often and breathes more.
 */
function thinRepeats(notes: SongNote[], pitch: number, minGap: number): SongNote[] {
  let last = -Infinity
  return notes.filter((n) => {
    if (n.midi !== pitch) return true
    if (n.start - last < minGap - 1e-6) return false
    last = n.start
    return true
  })
}

const E4 = M('E4')
const thinE = (notes: SongNote[]) => thinRepeats(notes, E4, 0.75)

// ─── Assemble the piece ───────────────────────────────────────────────
// Easy   = the recognizable intro (pulse + chord stabs)
// Medium = intro + the high-E octave section
// Hard   = the full song (all sections)

const common = {
  composer: 'Hans Zimmer (arr.)',
  timeSignature: [4, 4] as [number, number],
  keySignature: 'C',
}

const easy: Song = {
  id: 'interstellar-easy',
  title: 'Interstellar Theme',
  difficulty: 'easy',
  bpm: 90,
  ...common,
  notes: thinE(parseAll(SEG_INTRO)),
}

const medium: Song = {
  id: 'interstellar-medium',
  title: 'Interstellar Theme',
  difficulty: 'medium',
  bpm: 95,
  ...common,
  notes: thinE(parseAll(SEG_INTRO, SEG_OCTAVE)),
}

const hard: Song = {
  id: 'interstellar-hard',
  title: 'Interstellar Theme',
  difficulty: 'hard',
  bpm: 95,
  ...common,
  notes: thinE(parseAll(SEG_INTRO, SEG_RUNS, SEG_OCTAVE, SEG_CLIMAX, SEG_ENDING)),
}

export const interstellar: SongPiece = {
  id: 'interstellar',
  title: 'Interstellar Theme',
  composer: 'Hans Zimmer (arr.)',
  blurb: 'Zimmer’s repeated-E pulse with climbing chords — the full virtualpiano theme.',
  variants: { easy, medium, hard },
}
