// Web Audio metronome for rhythm training

class Metronome {
  private ctx: AudioContext | null = null
  private intervalId: number | null = null
  private _bpm = 80
  private _running = false
  private beatCallback: ((beat: number) => void) | null = null
  private currentBeat = 0

  get bpm(): number {
    return this._bpm
  }

  set bpm(val: number) {
    if (!Number.isFinite(val)) return
    this._bpm = Math.max(40, Math.min(200, val))
    if (this._running) {
      this.stop()
      this.start()
    }
  }

  get running(): boolean {
    return this._running
  }

  onBeat(cb: (beat: number) => void): void {
    this.beatCallback = cb
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  private playClick(accent: boolean): void {
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = accent ? 1000 : 800
    gain.gain.setValueAtTime(accent ? 0.3 : 0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  start(): void {
    if (this._running) return
    this._running = true
    this.currentBeat = 0

    const msPerBeat = 60000 / this._bpm
    this.tick()
    this.intervalId = window.setInterval(() => this.tick(), msPerBeat)
  }

  private tick(): void {
    const accent = this.currentBeat % 4 === 0
    this.playClick(accent)
    this.beatCallback?.(this.currentBeat)
    this.currentBeat++
  }

  stop(): void {
    this._running = false
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.currentBeat = 0
  }

  dispose(): void {
    this.stop()
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close()
    }
    this.ctx = null
  }
}

export const metronome = new Metronome()
