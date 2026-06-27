import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type { Song } from '#/lib/songs/types'
import type { KeyboardLayout } from '#/lib/keyboard-layout'

interface PianoRollProps {
  song: Song
  layout: KeyboardLayout
  /** Live playback position in beats (mutated each frame by the playback hook). */
  currentBeatRef: MutableRefObject<number>
  /** Vertical pixels per beat (controls fall speed / spacing). */
  pxPerBeat?: number
  isDark?: boolean
}

// Hand colors
const RIGHT = { base: '#7C3AED', bright: '#A78BFA', glow: 'rgba(167,139,250,0.55)' }
const LEFT = { base: '#0E7490', bright: '#2DD4BF', glow: 'rgba(45,212,191,0.5)' }

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * Canvas-based falling-note view. Notes descend toward a hit line at the bottom
 * (where the keyboard begins). Right-hand notes are violet, left-hand teal.
 */
export function PianoRoll({
  song,
  layout,
  currentBeatRef,
  pxPerBeat = 90,
  isDark = false,
}: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const beatsPerBar = song.timeSignature[0]

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = container.clientWidth
      const h = container.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      sizeRef.current = { w, h, dpr }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const draw = () => {
      const { w, h, dpr } = sizeRef.current
      const beat = currentBeatRef.current
      const hitLineY = h - 1

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      // Background
      ctx.fillStyle = isDark ? '#0E0B16' : '#F4F1FA'
      ctx.fillRect(0, 0, w, h)

      // Vertical lane separators aligned to white-key boundaries
      ctx.lineWidth = 1
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
      for (const [, geom] of layout.keys) {
        if (geom.isBlack) continue
        const x = (geom.leftPct / 100) * w
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      // Horizontal beat + bar lines
      const topBeat = beat + h / pxPerBeat
      const firstBeat = Math.floor(beat)
      for (let b = firstBeat; b <= topBeat + 1; b++) {
        const y = hitLineY - (b - beat) * pxPerBeat
        if (y < 0 || y > h) continue
        const isBar = b % beatsPerBar === 0
        ctx.strokeStyle = isBar
          ? isDark
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(0,0,0,0.1)'
          : isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.04)'
        ctx.lineWidth = isBar ? 1.5 : 1
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Notes
      for (const note of song.notes) {
        const bottom = hitLineY - (note.start - beat) * pxPerBeat
        const noteH = note.duration * pxPerBeat
        const top = bottom - noteH
        if (bottom < 0 || top > h) continue // off-screen

        const geom = layout.keys.get(note.midi)
        if (!geom) continue

        const cx = (geom.centerPct / 100) * w
        const noteW = Math.max(6, (geom.widthPct / 100) * w * 0.86)
        const x = cx - noteW / 2

        const active = note.start <= beat && beat < note.start + note.duration
        const palette = note.hand === 'right' ? RIGHT : LEFT

        if (active) {
          ctx.shadowColor = palette.glow
          ctx.shadowBlur = 16
          ctx.fillStyle = palette.bright
        } else {
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.fillStyle = palette.base
        }

        const drawTop = Math.max(top, -4)
        const drawH = Math.min(bottom, h) - drawTop
        roundRect(ctx, x, drawTop, noteW, Math.max(4, drawH), 4)
        ctx.fill()

        // Subtle top highlight
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(255,255,255,0.18)'
        roundRect(ctx, x, drawTop, noteW, Math.min(5, Math.max(4, drawH)), 4)
        ctx.fill()
      }

      // Hit line glow
      ctx.shadowBlur = 0
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(124,58,237,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, hitLineY)
      ctx.lineTo(w, hitLineY)
      ctx.stroke()

      ctx.restore()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      ro.disconnect()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [song, layout, currentBeatRef, pxPerBeat, isDark])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
