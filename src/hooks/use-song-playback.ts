import { useCallback, useEffect, useRef, useState } from 'react'
import type { Song } from '#/lib/songs/types'
import { songDurationBeats } from '#/lib/songs/types'
import type { useAudio } from './use-audio'

export type TempoScale = 0.5 | 0.75 | 1

interface UseSongPlaybackOptions {
  song: Song
  audio: ReturnType<typeof useAudio>
}

/**
 * Drives song playback with a requestAnimationFrame beat clock.
 *
 * - `currentBeatRef` is mutated every frame and read directly by the canvas
 *   piano roll, avoiding a React re-render per frame.
 * - `activeMidis` updates only when the set of sounding notes changes, so it can
 *   safely drive React-rendered highlights (keyboard + sheet).
 */
export function useSongPlayback({ song, audio }: UseSongPlaybackOptions) {
  const durationBeats = songDurationBeats(song)

  const [isPlaying, setIsPlaying] = useState(false)
  const [tempoScale, setTempoScale] = useState<TempoScale>(1)
  const [activeMidis, setActiveMidis] = useState<Set<number>>(new Set())
  // Throttled beat value for React consumers (scrubber, bar readout) ~10fps
  const [displayBeat, setDisplayBeat] = useState(0)

  const currentBeatRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const nextNoteIndexRef = useRef(0)
  const activeMidisRef = useRef<Set<number>>(new Set())
  const lastDisplayUpdateRef = useRef(0)
  const tempoRef = useRef<TempoScale>(1)
  const playingRef = useRef(false)
  // Live damp duration so changes apply mid-playback without restarting the loop
  const dampRef = useRef(audio.dampDuration)
  dampRef.current = audio.dampDuration

  tempoRef.current = tempoScale

  const secondsPerBeat = useCallback(() => 60 / song.bpm, [song.bpm])

  // Recompute the next-note pointer after a seek/jump.
  const resyncPointer = useCallback(
    (beat: number) => {
      let i = 0
      while (i < song.notes.length && song.notes[i].start < beat) i++
      nextNoteIndexRef.current = i
    },
    [song.notes],
  )

  const updateActiveMidis = useCallback(
    (beat: number) => {
      const next = new Set<number>()
      for (const n of song.notes) {
        if (n.start <= beat && beat < n.start + n.duration) next.add(n.midi)
      }
      // Diff against current to avoid needless re-renders
      const cur = activeMidisRef.current
      let same = cur.size === next.size
      if (same) {
        for (const v of next) {
          if (!cur.has(v)) {
            same = false
            break
          }
        }
      }
      if (!same) {
        activeMidisRef.current = next
        setActiveMidis(next)
      }
    },
    [song.notes],
  )

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTsRef.current = null
  }, [])

  const tick = useCallback(
    (ts: number) => {
      if (!playingRef.current) return
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dtSec = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts

      const beatsAdvanced = (dtSec / secondsPerBeat()) * tempoRef.current
      let beat = currentBeatRef.current + beatsAdvanced

      // Trigger audio for any notes whose start we just passed
      const notes = song.notes
      while (
        nextNoteIndexRef.current < notes.length &&
        notes[nextNoteIndexRef.current].start <= beat
      ) {
        const note = notes[nextNoteIndexRef.current]
        // Let the note ring naturally: a struck piano note sustains well past
        // its notated length. Ring for at least the damp duration so playback
        // doesn't sound clipped/robotic.
        const beatSec = (note.duration * secondsPerBeat()) / tempoRef.current
        const ringSec = Math.max(beatSec, dampRef.current)
        audio.playNote(note.midi, ringSec)
        nextNoteIndexRef.current++
      }

      currentBeatRef.current = beat
      updateActiveMidis(beat)

      // Throttled React update for the scrubber/readout
      if (ts - lastDisplayUpdateRef.current > 90) {
        lastDisplayUpdateRef.current = ts
        setDisplayBeat(beat)
      }

      if (beat >= durationBeats) {
        // Reached the end — stop and reset
        playingRef.current = false
        setIsPlaying(false)
        currentBeatRef.current = durationBeats
        setDisplayBeat(durationBeats)
        updateActiveMidis(durationBeats + 1) // clear
        stopLoop()
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [audio, durationBeats, secondsPerBeat, song.notes, stopLoop, updateActiveMidis],
  )

  const play = useCallback(() => {
    if (playingRef.current) return
    audio.init()
    // If at (or past) the end, restart from the top
    if (currentBeatRef.current >= durationBeats - 1e-6) {
      currentBeatRef.current = 0
      resyncPointer(0)
    }
    playingRef.current = true
    setIsPlaying(true)
    lastTsRef.current = null
    rafRef.current = requestAnimationFrame(tick)
  }, [audio, durationBeats, resyncPointer, tick])

  const pause = useCallback(() => {
    playingRef.current = false
    setIsPlaying(false)
    stopLoop()
  }, [stopLoop])

  const restart = useCallback(() => {
    currentBeatRef.current = 0
    resyncPointer(0)
    setDisplayBeat(0)
    updateActiveMidis(-1)
  }, [resyncPointer, updateActiveMidis])

  const seek = useCallback(
    (beat: number) => {
      const clamped = Math.max(0, Math.min(durationBeats, beat))
      currentBeatRef.current = clamped
      resyncPointer(clamped)
      setDisplayBeat(clamped)
      updateActiveMidis(clamped)
    },
    [durationBeats, resyncPointer, updateActiveMidis],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => stopLoop()
  }, [stopLoop])

  return {
    isPlaying,
    play,
    pause,
    restart,
    seek,
    tempoScale,
    setTempoScale,
    durationBeats,
    displayBeat,
    currentBeatRef,
    activeMidis,
  }
}
