// Shared keyboard geometry so the piano roll can align its falling-note
// columns exactly with the <PianoKeyboard /> rendered below it.
//
// Mirrors the positioning math inside piano-keyboard.tsx:
//   - white keys are evenly spaced, width = 100 / whiteKeyCount (percent)
//   - black keys sit at (prevWhiteIndex + 1) * whiteKeyWidth - 0.3 * whiteKeyWidth
//     with width = 0.58 * whiteKeyWidth

import { generateKeyRange, isBlackKey } from './notes'

export interface KeyGeometry {
  /** Center of the key as a percentage (0-100) of the keyboard width */
  centerPct: number
  /** Left edge of the key as a percentage */
  leftPct: number
  /** Width of the key as a percentage */
  widthPct: number
  isBlack: boolean
}

export interface KeyboardLayout {
  startOctave: number
  numOctaves: number
  startMidi: number
  endMidi: number
  /** Geometry keyed by MIDI note number */
  keys: Map<number, KeyGeometry>
}

/** Compute the geometry for every key in a range (matches PianoKeyboard). */
export function computeKeyLayout(startOctave: number, numOctaves: number): KeyboardLayout {
  const allKeys = generateKeyRange(startOctave, numOctaves)
  const whiteKeys = allKeys.filter((k) => !isBlackKey(k))
  const whiteKeyWidth = 100 / whiteKeys.length

  const whitePos = new Map<number, number>()
  whiteKeys.forEach((midi, i) => whitePos.set(midi, i))

  const keys = new Map<number, KeyGeometry>()

  for (const midi of allKeys) {
    if (isBlackKey(midi)) {
      const prevPos = whitePos.get(midi - 1)
      if (prevPos === undefined) continue
      const leftPct = (prevPos + 1) * whiteKeyWidth - whiteKeyWidth * 0.3
      const widthPct = whiteKeyWidth * 0.58
      keys.set(midi, {
        leftPct,
        widthPct,
        centerPct: leftPct + widthPct / 2,
        isBlack: true,
      })
    } else {
      const pos = whitePos.get(midi)!
      const leftPct = pos * whiteKeyWidth
      keys.set(midi, {
        leftPct,
        widthPct: whiteKeyWidth,
        centerPct: leftPct + whiteKeyWidth / 2,
        isBlack: false,
      })
    }
  }

  return {
    startOctave,
    numOctaves,
    startMidi: allKeys[0],
    endMidi: allKeys[allKeys.length - 1],
    keys,
  }
}

/**
 * Pick a keyboard range (full octaves) that comfortably contains the given
 * MIDI notes, padded with a little headroom.
 */
export function layoutForNotes(midis: number[], minOctaves = 3): { startOctave: number; numOctaves: number } {
  if (midis.length === 0) return { startOctave: 4, numOctaves: minOctaves }
  const lo = Math.min(...midis)
  const hi = Math.max(...midis)

  const octaveOf = (m: number) => Math.floor(m / 12) - 1

  let startOctave = octaveOf(lo)
  const endOctave = octaveOf(hi) + 1 // include the octave above the top note's C

  let numOctaves = Math.max(minOctaves, endOctave - startOctave)
  if (numOctaves > 5) numOctaves = 5
  if (startOctave < 1) startOctave = 1
  if (startOctave + numOctaves > 7) startOctave = Math.max(1, 7 - numOctaves)

  return { startOctave, numOctaves }
}
