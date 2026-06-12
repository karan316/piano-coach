import { useState, useCallback, useEffect, useRef } from 'react'
import { metronome } from '#/lib/metronome'

export function useMetronome() {
  const [bpm, setBpmState] = useState(80)
  const [running, setRunning] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    metronome.onBeat((beat) => {
      setCurrentBeat(beat)
    })
    return () => {
      metronome.stop()
    }
  }, [])

  const setBpm = useCallback((val: number) => {
    const n = Number(val)
    if (!Number.isFinite(n)) return
    metronome.bpm = n
    setBpmState(metronome.bpm)
  }, [])

  const start = useCallback(() => {
    metronome.bpm = bpm
    metronome.start()
    startTimeRef.current = performance.now()
    setRunning(true)
  }, [bpm])

  const stop = useCallback(() => {
    metronome.stop()
    setRunning(false)
    setCurrentBeat(-1)
  }, [])

  /** Get the expected time (ms since start) for a given beat position */
  const getBeatTime = useCallback((beatPosition: number): number => {
    const msPerBeat = 60000 / bpm
    return startTimeRef.current + beatPosition * msPerBeat
  }, [bpm])

  return { bpm, setBpm, running, currentBeat, start, stop, getBeatTime, startTime: startTimeRef }
}
