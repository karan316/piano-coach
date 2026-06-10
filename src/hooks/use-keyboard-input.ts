import { useEffect, useCallback, useRef, useState } from 'react'
import { KEYBOARD_MAP } from '#/lib/notes'

interface KeyboardInputOptions {
  /** Base octave for the keyboard mapping (default: 4) */
  baseOctave?: number
  /** Whether to capture keyboard events */
  enabled?: boolean
}

export function useKeyboardInput(options: KeyboardInputOptions = {}) {
  const { baseOctave: initialOctave = 4, enabled = true } = options
  const [octave, setOctave] = useState(initialOctave)
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set())
  const noteOnCallbacks = useRef<Array<(note: number) => void>>([])
  const noteOffCallbacks = useRef<Array<(note: number) => void>>([])
  const heldKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const key = e.key.toLowerCase()

      // Octave shift
      if (key === 'z') {
        setOctave((o) => Math.max(1, o - 1))
        return
      }
      if (key === 'x') {
        setOctave((o) => Math.min(7, o + 1))
        return
      }

      const offset = KEYBOARD_MAP[key]
      if (offset === undefined) return

      // Prevent default for mapped keys to avoid typing in inputs
      e.preventDefault()

      if (heldKeys.current.has(key)) return
      heldKeys.current.add(key)

      // Can't access latest octave in closure, store it
      const midi = (octave + 1) * 12 + offset
      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.add(midi)
        return next
      })

      for (const cb of noteOnCallbacks.current) {
        cb(midi)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const offset = KEYBOARD_MAP[key]
      if (offset === undefined) return

      heldKeys.current.delete(key)

      const midi = (octave + 1) * 12 + offset
      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.delete(midi)
        return next
      })

      for (const cb of noteOffCallbacks.current) {
        cb(midi)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      heldKeys.current.clear()
      setActiveKeys(new Set())
    }
  }, [enabled, octave])

  const onNoteOn = useCallback((cb: (note: number) => void) => {
    noteOnCallbacks.current.push(cb)
    return () => {
      noteOnCallbacks.current = noteOnCallbacks.current.filter((c) => c !== cb)
    }
  }, [])

  const onNoteOff = useCallback((cb: (note: number) => void) => {
    noteOffCallbacks.current.push(cb)
    return () => {
      noteOffCallbacks.current = noteOffCallbacks.current.filter((c) => c !== cb)
    }
  }, [])

  return { activeKeys, octave, setOctave, onNoteOn, onNoteOff }
}
