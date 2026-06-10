// Web MIDI API manager — handles connection, event parsing, and note tracking

export type MidiNoteHandler = (note: number, velocity: number) => void

export interface MidiState {
  isConnected: boolean
  deviceName: string | null
}

type MidiListener = (state: MidiState) => void

class MidiManager {
  private access: MIDIAccess | null = null
  private input: MIDIInput | null = null
  private noteOnHandlers: MidiNoteHandler[] = []
  private noteOffHandlers: MidiNoteHandler[] = []
  private stateListeners: MidiListener[] = []
  private _state: MidiState = { isConnected: false, deviceName: null }

  get state(): MidiState {
    return this._state
  }

  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
  }

  /** Request MIDI access and start listening for devices */
  async connect(): Promise<boolean> {
    if (!this.isSupported) return false

    try {
      this.access = await navigator.requestMIDIAccess()
      this.access.onstatechange = this.handleStateChange

      // Try to connect to first available input
      this.findAndConnectInput()
      return this._state.isConnected
    } catch {
      console.warn('MIDI access denied or unavailable')
      return false
    }
  }

  private findAndConnectInput(): void {
    if (!this.access) return

    // Disconnect existing
    if (this.input) {
      this.input.onmidimessage = null
      this.input = null
    }

    // Find first available input
    for (const input of this.access.inputs.values()) {
      if (input.state === 'connected') {
        this.input = input
        this.input.onmidimessage = this.handleMessage
        this.updateState(true, input.name ?? 'MIDI Device')
        return
      }
    }

    this.updateState(false, null)
  }

  private updateState(isConnected: boolean, deviceName: string | null): void {
    this._state = { isConnected, deviceName }
    for (const listener of this.stateListeners) {
      listener(this._state)
    }
  }

  private handleStateChange = (): void => {
    this.findAndConnectInput()
  }

  private handleMessage = (event: MIDIMessageEvent): void => {
    const data = event.data
    if (!data || data.length < 3) return

    const statusByte = data[0] & 0xf0
    const note = data[1]
    const velocity = data[2]

    if (statusByte === 0x90 && velocity > 0) {
      // Note On
      for (const handler of this.noteOnHandlers) {
        handler(note, velocity)
      }
    } else if (statusByte === 0x80 || (statusByte === 0x90 && velocity === 0)) {
      // Note Off (0x80) or Note On with velocity 0 (common alternative)
      for (const handler of this.noteOffHandlers) {
        handler(note, velocity)
      }
    }
  }

  /** Subscribe to note on events */
  onNoteOn(handler: MidiNoteHandler): () => void {
    this.noteOnHandlers.push(handler)
    return () => {
      this.noteOnHandlers = this.noteOnHandlers.filter((h) => h !== handler)
    }
  }

  /** Subscribe to note off events */
  onNoteOff(handler: MidiNoteHandler): () => void {
    this.noteOffHandlers.push(handler)
    return () => {
      this.noteOffHandlers = this.noteOffHandlers.filter((h) => h !== handler)
    }
  }

  /** Subscribe to connection state changes */
  onStateChange(listener: MidiListener): () => void {
    this.stateListeners.push(listener)
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener)
    }
  }

  /** Disconnect and clean up */
  disconnect(): void {
    if (this.input) {
      this.input.onmidimessage = null
      this.input = null
    }
    if (this.access) {
      this.access.onstatechange = null
      this.access = null
    }
    this.updateState(false, null)
    this.noteOnHandlers = []
    this.noteOffHandlers = []
    this.stateListeners = []
  }
}

// Singleton
export const midiManager = new MidiManager()
