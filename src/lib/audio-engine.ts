// Web Audio API synthesizer with two modes:
// - Grand Piano: sample-based playback from recorded .ogg files
// - Electric Piano: rich multi-harmonic synthesis with inharmonicity + body resonance

import { noteFrequency } from './notes'

export type PianoMode = 'grand' | 'electric'

const STORAGE_KEY = 'piano-coach-sound-mode'

interface ActiveNote {
  source?: AudioBufferSourceNode
  oscillators: OscillatorNode[]
  gain: GainNode
  extras: AudioNode[] // filters, extra gain nodes to disconnect on cleanup
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeOscillators = new Map<number, ActiveNote>()
  private _mode: PianoMode = 'grand'

  // Sample buffer cache: MIDI note → decoded AudioBuffer
  private sampleCache = new Map<number, AudioBuffer>()
  private loadingPromises = new Map<number, Promise<AudioBuffer | null>>()

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'grand' || stored === 'electric') this._mode = stored
    }
  }

  get mode(): PianoMode {
    return this._mode
  }

  set mode(m: PianoMode) {
    this._mode = m
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, m)
    }
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.5
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  private getMasterGain(): GainNode {
    this.ensureContext()
    return this.masterGain!
  }

  // ─── Sample File Mapping ─────────────────────────────────────────

  /**
   * Convert MIDI note number to sample filename.
   * Files are named: C4.ogg, Csharp4.ogg, D4.ogg, etc.
   * MIDI 21 = A0, MIDI 108 = C8
   */
  private static midiToSampleFilename(midi: number): string {
    const noteNames = ['C', 'Csharp', 'D', 'Dsharp', 'E', 'F', 'Fsharp', 'G', 'Gsharp', 'A', 'Asharp', 'B']
    const octave = Math.floor(midi / 12) - 1
    const noteIndex = midi % 12
    return `${noteNames[noteIndex]}${octave}.ogg`
  }

  /** Load and decode a sample for a MIDI note, with caching */
  private async loadSample(midi: number): Promise<AudioBuffer | null> {
    // Return cached
    const cached = this.sampleCache.get(midi)
    if (cached) return cached

    // Return in-flight promise if already loading
    const existing = this.loadingPromises.get(midi)
    if (existing) return existing

    const filename = AudioEngine.midiToSampleFilename(midi)
    const url = `/audio/${filename}`

    const promise = (async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) return null
        const arrayBuffer = await response.arrayBuffer()
        const ctx = this.ensureContext()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        this.sampleCache.set(midi, audioBuffer)
        return audioBuffer
      } catch {
        console.warn(`Failed to load sample: ${filename}`)
        return null
      } finally {
        this.loadingPromises.delete(midi)
      }
    })()

    this.loadingPromises.set(midi, promise)
    return promise
  }

  /** Preload samples for a range of notes (call during init for responsiveness) */
  async preloadSamples(startMidi: number, endMidi: number): Promise<void> {
    const promises: Promise<AudioBuffer | null>[] = []
    for (let midi = startMidi; midi <= endMidi; midi++) {
      if (midi >= 21 && midi <= 108) {
        promises.push(this.loadSample(midi))
      }
    }
    await Promise.all(promises)
  }

  // ─── Grand Piano (Sample-Based) ─────────────────────────────────

  private startGrandSample(midi: number, buffer: AudioBuffer, fixedDuration?: number): ActiveNote {
    const ctx = this.ensureContext()
    const master = this.getMasterGain()
    const now = ctx.currentTime

    // Create buffer source
    const source = ctx.createBufferSource()
    source.buffer = buffer

    // Gain envelope for the sample
    const noteGain = ctx.createGain()
    noteGain.gain.setValueAtTime(1.0, now)

    if (fixedDuration) {
      // For fixed duration, fade out near the end
      const fadeStart = Math.max(0, fixedDuration - 0.3)
      noteGain.gain.setValueAtTime(1.0, now + fadeStart)
      noteGain.gain.linearRampToValueAtTime(0, now + fixedDuration)
    }
    // For sustained notes (no fixedDuration), gain stays at 1.0 until releaseNote is called

    source.connect(noteGain)
    noteGain.connect(master)

    source.start(now)
    if (fixedDuration) {
      source.stop(now + fixedDuration + 0.1)
    }

    const active: ActiveNote = { source, oscillators: [], gain: noteGain, extras: [] }
    this.activeOscillators.set(midi, active)

    // Auto-cleanup for fixed duration or when sample ends naturally
    source.onended = () => {
      this.cleanupNote(midi)
    }

    return active
  }

  /** Start a grand piano note — loads sample, falls back to electric synth if unavailable */
  private async startGrandNoteAsync(midi: number, fixedDuration?: number): Promise<void> {
    const buffer = await this.loadSample(midi)
    if (buffer) {
      // Check that a newer note hasn't already replaced us while we were loading
      if (!this.activeOscillators.has(midi)) {
        this.startGrandSample(midi, buffer, fixedDuration)
      }
    } else {
      // Fallback to electric synth if sample not available
      if (!this.activeOscillators.has(midi)) {
        this.startElectricNote(midi, fixedDuration)
      }
    }
  }

  /** Start grand note synchronously if cached, otherwise async-load */
  private startGrandNote(midi: number, fixedDuration?: number): void {
    const cached = this.sampleCache.get(midi)
    if (cached) {
      this.startGrandSample(midi, cached, fixedDuration)
    } else {
      // Play electric synth immediately as a placeholder while loading
      this.startElectricNote(midi, fixedDuration)
      // Load in background — next time it will be instant
      void this.loadSample(midi)
    }
  }

  // ─── Electric Piano (Rich Synthesis) ─────────────────────────────
  //
  // Multi-harmonic synthesis with:
  // - 8 harmonics with per-harmonic decay rates
  // - 2-3 detuned oscillators per harmonic (multi-string simulation)
  // - Inharmonic stretching (piano string stiffness)
  // - Hammer strike transient (filtered noise burst)
  // - Soundboard body resonance (peaking EQ filters)
  // - Dynamic lowpass filter that closes over time
  // - Long sustain with double-decay envelope

  private static readonly SYNTH_HARMONICS = [
    { ratio: 1, amp: 1.0, decay: 1.0 },
    { ratio: 2, amp: 0.65, decay: 0.85 },
    { ratio: 3, amp: 0.35, decay: 0.7 },
    { ratio: 4, amp: 0.22, decay: 0.6 },
    { ratio: 5, amp: 0.12, decay: 0.5 },
    { ratio: 6, amp: 0.08, decay: 0.4 },
    { ratio: 7, amp: 0.04, decay: 0.3 },
    { ratio: 8, amp: 0.025, decay: 0.25 },
  ]

  private static inharmonicFreq(baseFreq: number, harmonicNumber: number): number {
    const B = baseFreq < 200 ? 0.0006 : baseFreq < 500 ? 0.0004 : 0.0002
    return baseFreq * harmonicNumber * Math.sqrt(1 + B * harmonicNumber * harmonicNumber)
  }

  private static stringsPerNote(midi: number): number {
    if (midi < 40) return 1
    if (midi < 52) return 2
    return 3
  }

  private startElectricNote(midi: number, fixedDuration?: number): ActiveNote {
    const ctx = this.ensureContext()
    const master = this.getMasterGain()
    const freq = noteFrequency(midi)
    const now = ctx.currentTime
    const numStrings = AudioEngine.stringsPerNote(midi)

    const decayScale = Math.max(0.35, 1.2 - (midi - 30) / 75)
    const sustainTime = fixedDuration ?? (10.0 * decayScale)

    const noteGain = ctx.createGain()
    noteGain.gain.setValueAtTime(0, now)

    // Body resonance filters
    const bodyResonance = ctx.createBiquadFilter()
    bodyResonance.type = 'peaking'
    bodyResonance.frequency.value = 250
    bodyResonance.Q.value = 2
    bodyResonance.gain.value = 3

    const bodyResonance2 = ctx.createBiquadFilter()
    bodyResonance2.type = 'peaking'
    bodyResonance2.frequency.value = 1200
    bodyResonance2.Q.value = 1.5
    bodyResonance2.gain.value = 2

    // Dynamic lowpass filter
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    const cutoffStart = Math.min(freq * 16, 16000)
    const cutoffMid = Math.min(freq * 8, 8000)
    const cutoffEnd = Math.min(freq * 2.5, 2500)
    filter.frequency.setValueAtTime(cutoffStart, now)
    filter.frequency.exponentialRampToValueAtTime(cutoffMid, now + 0.5 * decayScale)
    filter.frequency.exponentialRampToValueAtTime(cutoffEnd, now + 4.0 * decayScale)
    filter.Q.value = 0.5

    noteGain.connect(bodyResonance)
    bodyResonance.connect(bodyResonance2)
    bodyResonance2.connect(filter)
    filter.connect(master)

    // Double-decay envelope
    const peakGain = 0.45
    const promptLevel = peakGain * 0.45
    const sustainLevel = peakGain * 0.15
    const tailLevel = 0.005

    noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.003)
    noteGain.gain.exponentialRampToValueAtTime(promptLevel, now + 0.06)
    noteGain.gain.exponentialRampToValueAtTime(sustainLevel, now + 2.0 * decayScale)
    noteGain.gain.exponentialRampToValueAtTime(tailLevel, now + sustainTime)

    if (fixedDuration) {
      noteGain.gain.linearRampToValueAtTime(0, now + fixedDuration + 0.1)
    }

    // Harmonic oscillators with per-string detuning
    const oscillators: OscillatorNode[] = []
    const extras: AudioNode[] = [filter, bodyResonance, bodyResonance2]

    for (const h of AudioEngine.SYNTH_HARMONICS) {
      const harmonicFreq = AudioEngine.inharmonicFreq(freq, h.ratio)
      if (harmonicFreq > 18000) break

      const harmonicGainNode = ctx.createGain()
      const baseAmp = h.amp * 0.18
      harmonicGainNode.gain.setValueAtTime(baseAmp, now)
      const harmonicDecayTime = sustainTime * h.decay
      harmonicGainNode.gain.exponentialRampToValueAtTime(baseAmp * 0.01, now + harmonicDecayTime)
      harmonicGainNode.connect(noteGain)
      extras.push(harmonicGainNode)

      for (let s = 0; s < numStrings; s++) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(harmonicFreq, now)

        const detuneSpread = 1.5
        let detuneCents: number
        if (numStrings === 1) detuneCents = 0
        else if (numStrings === 2) detuneCents = s === 0 ? -detuneSpread : detuneSpread
        else detuneCents = (s - 1) * detuneSpread
        detuneCents += (Math.random() - 0.5) * 0.6
        osc.detune.setValueAtTime(detuneCents, now)

        osc.connect(harmonicGainNode)
        osc.start(now)
        if (fixedDuration) osc.stop(now + fixedDuration + 0.2)

        oscillators.push(osc)
      }
    }

    // Hammer strike transient
    const hammerDuration = 0.012
    const bufferSize = Math.ceil(ctx.sampleRate * hammerDuration)
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2)
      noiseData[i] = (Math.random() * 2 - 1) * env
    }
    const hammerSource = ctx.createBufferSource()
    hammerSource.buffer = noiseBuffer
    const hammerBPF = ctx.createBiquadFilter()
    hammerBPF.type = 'bandpass'
    hammerBPF.frequency.value = Math.min(freq * 6, 10000)
    hammerBPF.Q.value = 1.2
    const hammerGain = ctx.createGain()
    hammerGain.gain.setValueAtTime(0.25, now)
    hammerGain.gain.exponentialRampToValueAtTime(0.001, now + hammerDuration)
    hammerSource.connect(hammerBPF)
    hammerBPF.connect(hammerGain)
    hammerGain.connect(noteGain)
    hammerSource.start(now)
    hammerSource.stop(now + hammerDuration + 0.01)
    extras.push(hammerBPF, hammerGain)

    // Sympathetic resonance
    if (freq * 2 < 16000) {
      const sympOsc = ctx.createOscillator()
      sympOsc.type = 'sine'
      sympOsc.frequency.setValueAtTime(freq * 2, now)
      const sympGain = ctx.createGain()
      sympGain.gain.setValueAtTime(0, now)
      sympGain.gain.linearRampToValueAtTime(0.012, now + 0.3)
      sympGain.gain.exponentialRampToValueAtTime(0.001, now + sustainTime * 0.6)
      sympOsc.connect(sympGain)
      sympGain.connect(noteGain)
      sympOsc.start(now)
      if (fixedDuration) sympOsc.stop(now + fixedDuration + 0.2)
      oscillators.push(sympOsc)
      extras.push(sympGain)
    }

    const active: ActiveNote = { oscillators, gain: noteGain, extras }
    this.activeOscillators.set(midi, active)

    if (fixedDuration) {
      oscillators[0].onended = () => {
        this.cleanupNote(midi)
      }
    }

    return active
  }

  // ─── Public API ──────────────────────────────────────────────────

  /** Play a note for a fixed duration (used by ear training / chime) */
  playNote(midi: number, duration = 0.8): void {
    this.releaseNote(midi)
    if (this._mode === 'grand') {
      this.startGrandNote(midi, duration)
    } else {
      this.startElectricNote(midi, duration)
    }
  }

  /** Start a sustained note (for key-down), call releaseNote to stop */
  startNote(midi: number): void {
    this.releaseNote(midi)
    if (this._mode === 'grand') {
      this.startGrandNote(midi)
    } else {
      this.startElectricNote(midi)
    }
  }

  /** Release a sustained note (key-up) with a natural fade out */
  releaseNote(midi: number): void {
    const active = this.activeOscillators.get(midi)
    if (!active) return

    const ctx = this.ensureContext()
    const now = ctx.currentTime
    // Grand samples: fade out over 2s (damper landing on strings)
    // Electric synth: fade out over 1.8s (long resonance tail)
    const release = this._mode === 'grand' ? 2.0 : 1.8

    active.gain.gain.cancelScheduledValues(now)
    active.gain.gain.setValueAtTime(active.gain.gain.value, now)
    active.gain.gain.exponentialRampToValueAtTime(0.001, now + release)
    active.gain.gain.linearRampToValueAtTime(0, now + release + 0.05)

    // Stop oscillators (electric mode)
    for (const osc of active.oscillators) {
      osc.stop(now + release + 0.1)
    }

    // Stop sample source (grand mode)
    if (active.source) {
      active.source.stop(now + release + 0.1)
    }

    this.activeOscillators.delete(midi)
  }

  private cleanupNote(midi: number): void {
    const active = this.activeOscillators.get(midi)
    if (!active) return
    active.gain.disconnect()
    for (const node of active.extras) {
      node.disconnect()
    }
    this.activeOscillators.delete(midi)
  }

  /** Play a pleasant success chime */
  playChime(): void {
    const ctx = this.ensureContext()
    const master = this.getMasterGain()
    const now = ctx.currentTime

    const notes = [72, 76, 79] // C5, E5, G5 — major chord arpeggio
    notes.forEach((midi, i) => {
      const delay = i * 0.08
      const freq = noteFrequency(midi)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.02)
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.5)
      gain.connect(master)

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + delay)
      osc.connect(gain)
      osc.start(now + delay)
      osc.stop(now + delay + 0.55)
    })
  }

  /** Play a gentle error buzz */
  playBuzz(): void {
    const ctx = this.ensureContext()
    const master = this.getMasterGain()
    const now = ctx.currentTime

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.2)
    gain.connect(master)

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, now)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.25)
  }

  /** Initialize the audio context (must be called from a user gesture) */
  init(): void {
    this.ensureContext()
  }

  get isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running'
  }

  dispose(): void {
    for (const [midi] of this.activeOscillators) {
      this.releaseNote(midi)
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close()
    }
    this.ctx = null
    this.masterGain = null
  }
}

// Singleton instance
export const audioEngine = new AudioEngine()
