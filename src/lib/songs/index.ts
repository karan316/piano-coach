// Song registry. Add new pieces here once authored (or produced by the
// audio-to-notation pipeline).

import { interstellar } from './interstellar'
import type { Difficulty, Song, SongPiece } from './types'

export * from './types'

export const SONG_PIECES: SongPiece[] = [interstellar]

/** Look up a piece by id. */
export function getPiece(id: string): SongPiece | undefined {
  return SONG_PIECES.find((p) => p.id === id)
}

/** Look up a specific song variant by its full song id (e.g. "interstellar-easy"). */
export function getSong(songId: string): Song | undefined {
  for (const piece of SONG_PIECES) {
    for (const diff of ['easy', 'medium', 'hard'] as Difficulty[]) {
      if (piece.variants[diff].id === songId) return piece.variants[diff]
    }
  }
  return undefined
}
