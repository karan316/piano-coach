import { useState, useCallback, useEffect, useRef } from 'react'
import { audioEngine  } from '#/lib/audio-engine'
import type {PianoMode} from '#/lib/audio-engine';

export function useAudio() {
  const [isReady, setIsReady] = useState(false)
  const [mode, setModeState] = useState<PianoMode>(audioEngine.mode)
  const [dampDuration, setDampState] = useState(audioEngine.dampDuration)
  const [outputEnabled, setOutputEnabledState] = useState(audioEngine.outputEnabled)
  const initialized = useRef(false)

  // Keep local state in sync with the engine (it can change from MIDI auto-mute)
  useEffect(() => {
    return audioEngine.onOutputChange(() => setOutputEnabledState(audioEngine.outputEnabled))
  }, [])

  // Initialize on first user interaction
  const init = useCallback(() => {
    if (!initialized.current) {
      audioEngine.init()
      initialized.current = true
      setIsReady(true)
    }
  }, [])

  const setMode = useCallback((m: PianoMode) => {
    audioEngine.mode = m
    setModeState(m)
    // Preload samples when switching to grand mode
    if (m === 'grand') {
      void audioEngine.preloadSamples(48, 84) // C3 to C6
    }
  }, [])

  const setDampDuration = useCallback((d: number) => {
    audioEngine.dampDuration = d
    setDampState(audioEngine.dampDuration)
  }, [])

  const setOutputEnabled = useCallback((v: boolean) => {
    audioEngine.outputEnabled = v
  }, [])

  const preloadSamples = useCallback((startMidi: number, endMidi: number) => {
    return audioEngine.preloadSamples(startMidi, endMidi)
  }, [])

  const playNote = useCallback((midi: number, duration?: number) => {
    init()
    audioEngine.playNote(midi, duration)
  }, [init])

  const startNote = useCallback((midi: number) => {
    init()
    audioEngine.startNote(midi)
  }, [init])

  const releaseNote = useCallback((midi: number) => {
    audioEngine.releaseNote(midi)
  }, [])

  const playChime = useCallback(() => {
    init()
    audioEngine.playChime()
  }, [init])

  const playBuzz = useCallback(() => {
    init()
    audioEngine.playBuzz()
  }, [init])

  useEffect(() => {
    return () => {
      audioEngine.dispose()
      initialized.current = false
    }
  }, [])

  return { playNote, startNote, releaseNote, playChime, playBuzz, isReady, init, mode, setMode, preloadSamples, dampDuration, setDampDuration, outputEnabled, setOutputEnabled }
}
