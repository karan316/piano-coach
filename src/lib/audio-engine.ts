// Web Audio API synthesizer with two modes: Grand Piano and Electric Piano

import { noteFrequency } from './notes'

export type PianoMode = 'grand' | 'electric'

const STORAGE_KEY = 'piano-coach-sound-mode'

interface ActiveNote {
  oscillators: OscillatorNode[]
  gain: GainNode
  extras: AudioNode[] // filters, extra gain nodes to disconnect on cleanup
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeOscillators = new Map<number, ActiveNote>()
  private _mode: PianoMode = 'grand'

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

  // ─── Grand Piano Synthesis ───────────────────────────────────────
  //
  // Simulates a real grand piano with:
  // - 8 harmonics with realistic amplitude + per-harmonic decay rates
  // - 2-3 detuned oscillators per harmonic (simulating triple-strung piano strings)
  // - Inharmonic stretching (piano string stiffness)
  // - Hammer strike transient (filtered noise burst)
  // - Soundboard body resonance (peaking EQ filter)
  // - Dynamic lowpass filter that closes over time
  // - Long sustain with "pedal held" feel (~8-15 seconds of decay)
  // - Double-decay envelope (fast initial drop, then long slow tail)

  /** Harmonic partials with individual decay multipliers */
  private static readonly GRAND_HARMONICS = [
    { ratio: 1, amp: 1.0, decay: 1.0 },     // fundamental — sustains longest
    { ratio: 2, amp: 0.65, decay: 0.85 },    // octave
    { ratio: 3, amp: 0.35, decay: 0.7 },     // 12th
    { ratio: 4, amp: 0.22, decay: 0.6 },     // double octave
    { ratio: 5, amp: 0.12, decay: 0.5 },     // major 3rd + 2 octaves
    { ratio: 6, amp: 0.08, decay: 0.4 },     // 5th + 2 octaves
    { ratio: 7, amp: 0.04, decay: 0.3 },     // minor 7th (adds color)
    { ratio: 8, amp: 0.025, decay: 0.25 },   // triple octave
  ]

  /** Piano string inharmonicity: higher partials stretched sharp */
  private static inharmonicFreq(baseFreq: number, harmonicNumber: number): number {
    // B varies by register — bass strings have higher inharmonicity
    const B = baseFreq < 200 ? 0.0006 : baseFreq < 500 ? 0.0004 : 0.0002
    return baseFreq * harmonicNumber * Math.sqrt(1 + B * harmonicNumber * harmonicNumber)
  }

  /** Number of "strings" per note (real pianos: 1 for bass, 2 for tenor, 3 for treble) */
  private static stringsPerNote(midi: number): number {
    if (midi < 40) return 1
    if (midi < 52) return 2
    return 3
  }

  private startGrandNote(midi: number, fixedDuration?: number): ActiveNote {
    const ctx = this.ensureContext()
    const master = this.getMasterGain()
    const freq = noteFrequency(midi)
    const now = ctx.currentTime
    const numStrings = AudioEngine.stringsPerNote(midi)

    // Higher notes decay faster; bass notes ring much longer
    const decayScale = Math.max(0.35, 1.2 - (midi - 30) / 75)
    // Full sustain time in seconds (simulating pedal held down)
    const sustainTime = fixedDuration ?? (10.0 * decayScale)

    // ─ Output chain: oscillators → noteGain → bodyResonance → filter → master
    const noteGain = ctx.createGain()
    noteGain.gain.setValueAtTime(0, now)

    // Body resonance: a peaking EQ around the soundboard's resonant frequency
    const bodyResonance = ctx.createBiquadFilter()
    bodyResonance.type = 'peaking'
    bodyResonance.frequency.value = 250 // soundboard fundamental ~250Hz
    bodyResonance.Q.value = 2
    bodyResonance.gain.value = 3

    // Second body resonance at higher frequency for brightness
    const bodyResonance2 = ctx.createBiquadFilter()
    bodyResonance2.type = 'peaking'
    bodyResonance2.frequency.value = 1200
    bodyResonance2.Q.value = 1.5
    bodyResonance2.gain.value = 2

    // Lowpass filter: starts very bright, slowly closes (string energy loss)
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

    // ─ Double-decay envelope (characteristic of real pianos)
    // Phase 1: Fast attack → quick drop to ~45% (the "prompt" sound)
    // Phase 2: Very slow exponential decay (the "sustain" / ring-out)
    const peakGain = 0.45
    const promptLevel = peakGain * 0.45
    const sustainLevel = peakGain * 0.15
    const tailLevel = 0.005

    noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.003) // 3ms attack
    noteGain.gain.exponentialRampToValueAtTime(promptLevel, now + 0.06) // fast initial drop
    noteGain.gain.exponentialRampToValueAtTime(sustainLevel, now + 2.0 * decayScale) // slow sustain
    noteGain.gain.exponentialRampToValueAtTime(tailLevel, now + sustainTime) // very long tail

    if (fixedDuration) {
      noteGain.gain.linearRampToValueAtTime(0, now + fixedDuration + 0.1)
    }

    // ─ Harmonic oscillators with per-string detuning
    const oscillators: OscillatorNode[] = []
    const extras: AudioNode[] = [filter, bodyResonance, bodyResonance2]

    for (const h of AudioEngine.GRAND_HARMONICS) {
      const harmonicFreq = AudioEngine.inharmonicFreq(freq, h.ratio)
      if (harmonicFreq > 18000) break

      // Per-harmonic amplitude envelope: higher harmonics decay faster
      const harmonicGainNode = ctx.createGain()
      const baseAmp = h.amp * 0.18 // scale down since we have many oscillators
      harmonicGainNode.gain.setValueAtTime(baseAmp, now)
      // Higher harmonics lose energy faster
      const harmonicDecayTime = sustainTime * h.decay
      harmonicGainNode.gain.exponentialRampToValueAtTime(
        baseAmp * 0.01,
        now + harmonicDecayTime,
      )
      harmonicGainNode.connect(noteGain)
      extras.push(harmonicGainNode)

      // Create multiple slightly-detuned oscillators per harmonic (multi-string simulation)
      for (let s = 0; s < numStrings; s++) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(harmonicFreq, now)

        // Detune each "string" slightly differently (±1.5 cents spread)
        // String 0 = center, others spread symmetrically
        const detuneSpread = 1.5
        let detuneCents: number
        if (numStrings === 1) {
          detuneCents = 0
        } else if (numStrings === 2) {
          detuneCents = s === 0 ? -detuneSpread : detuneSpread
        } else {
          detuneCents = (s - 1) * detuneSpread
        }
        // Add tiny random variation per string (+/- 0.3 cents)
        detuneCents += (Math.random() - 0.5) * 0.6
        osc.detune.setValueAtTime(detuneCents, now)

        osc.connect(harmonicGainNode)
        osc.start(now)
        if (fixedDuration) osc.stop(now + fixedDuration + 0.2)

        oscillators.push(osc)
      }
    }

    // ─ Hammer strike transient
    const hammerDuration = 0.012
    const bufferSize = Math.ceil(ctx.sampleRate * hammerDuration)
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      // Shaped noise burst — sharper attack, faster decay
      const env = Math.pow(1 - i / bufferSize, 2)
      noiseData[i] = (Math.random() * 2 - 1) * env
    }

    const hammerSource = ctx.createBufferSource()
    hammerSource.buffer = noiseBuffer

    const hammerBPF = ctx.createBiquadFilter()
    hammerBPF.type = 'bandpass'
    // Hammer brightness varies with pitch — higher notes have brighter hammers
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

    // ─ Sympathetic resonance: a very quiet, slow-building octave above
    if (freq * 2 < 16000) {
      const sympOsc = ctx.createOscillator()
      sympOsc.type = 'sine'
      sympOsc.frequency.setValueAtTime(freq * 2, now)
      const sympGain = ctx.createGain()
      sympGain.gain.setValueAtTime(0, now)
      sympGain.gain.linearRampToValueAtTime(0.012, now + 0.3) // slowly fades in
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

  // ─── Electric Piano Synthesis ────────────────────────────────────

  private startElectricNote(midi: number, fixedDuration?: number): ActiveNote {
    const ctx = this.ensureContext()
    const master = this.getMasterGain()
    const freq = noteFrequency(midi)
    const now = ctx.currentTime

    const noteGain = ctx.createGain()
    noteGain.gain.setValueAtTime(0, now)
    noteGain.connect(master)

    if (fixedDuration) {
      const attack = 0.01
      const decay = 0.15
      const sustainLevel = 0.4
      const release = 0.3
      noteGain.gain.linearRampToValueAtTime(0.8, now + attack)
      noteGain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay)
      noteGain.gain.setValueAtTime(sustainLevel, now + fixedDuration - release)
      noteGain.gain.linearRampToValueAtTime(0, now + fixedDuration)
    } else {
      noteGain.gain.linearRampToValueAtTime(0.7, now + 0.01)
      noteGain.gain.linearRampToValueAtTime(0.4, now + 0.15)
    }

    // Fundamental (sine) + overtone (triangle) for classic e-piano warmth
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(freq, now)
    osc1.connect(noteGain)

    const osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(freq, now)
    const overtoneGain = ctx.createGain()
    overtoneGain.gain.value = 0.25
    osc2.connect(overtoneGain)
    overtoneGain.connect(noteGain)
    osc2.detune.setValueAtTime(3, now)

    osc1.start(now)
    osc2.start(now)
    if (fixedDuration) {
      osc1.stop(now + fixedDuration + 0.05)
      osc2.stop(now + fixedDuration + 0.05)
    }

    const active: ActiveNote = { oscillators: [osc1, osc2], gain: noteGain, extras: [overtoneGain] }
    this.activeOscillators.set(midi, active)

    if (fixedDuration) {
      osc1.onended = () => {
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
    // Grand piano: long damper release (like lifting finger off key with pedal resonance)
    // The note doesn't cut abruptly — it fades like real felt dampers landing on strings
    const release = this._mode === 'grand' ? 1.8 : 0.3

    active.gain.gain.cancelScheduledValues(now)
    active.gain.gain.setValueAtTime(active.gain.gain.value, now)
    // Grand uses exponential for more natural fade; electric uses linear
    if (this._mode === 'grand') {
      active.gain.gain.exponentialRampToValueAtTime(0.001, now + release)
      active.gain.gain.linearRampToValueAtTime(0, now + release + 0.05)
    } else {
      active.gain.gain.linearRampToValueAtTime(0, now + release)
    }

    for (const osc of active.oscillators) {
      osc.stop(now + release + 0.1)
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
