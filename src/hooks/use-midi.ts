import { useState, useEffect, useCallback, useRef } from 'react'
import { midiManager, type MidiState } from '#/lib/midi-manager'

export function useMidi() {
  const [state, setState] = useState<MidiState>({ isConnected: false, deviceName: null })
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set())
  const noteOnCallbacks = useRef<Array<(note: number, velocity: number) => void>>([])

  useEffect(() => {
    void midiManager.connect()

    // Sync initial state
    setState(midiManager.state)

    const unsubState = midiManager.onStateChange((s) => setState(s))

    const unsubOn = midiManager.onNoteOn((note, velocity) => {
      setActiveNotes((prev) => {
        const next = new Set(prev)
        next.add(note)
        return next
      })
      for (const cb of noteOnCallbacks.current) {
        cb(note, velocity)
      }
    })

    const unsubOff = midiManager.onNoteOff((note) => {
      setActiveNotes((prev) => {
        const next = new Set(prev)
        next.delete(note)
        return next
      })
    })

    return () => {
      unsubState()
      unsubOn()
      unsubOff()
    }
  }, [])

  const onNoteOn = useCallback((cb: (note: number, velocity: number) => void) => {
    noteOnCallbacks.current.push(cb)
    return () => {
      noteOnCallbacks.current = noteOnCallbacks.current.filter((c) => c !== cb)
    }
  }, [])

  return {
    isConnected: state.isConnected,
    deviceName: state.deviceName,
    activeNotes,
    onNoteOn,
    isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  }
}
