import { Play, Pause, RotateCcw, ListMusic, Music } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import type { TempoScale } from '#/hooks/use-song-playback'

export type ViewMode = 'roll' | 'sheet'

interface PlaybackControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onRestart: () => void
  currentBeat: number
  durationBeats: number
  beatsPerBar: number
  onSeek: (beat: number) => void
  tempoScale: TempoScale
  onTempoChange: (t: TempoScale) => void
  mode: ViewMode
  onModeChange: (m: ViewMode) => void
}

export function PlaybackControls({
  isPlaying,
  onPlayPause,
  onRestart,
  currentBeat,
  durationBeats,
  beatsPerBar,
  onSeek,
  tempoScale,
  onTempoChange,
  mode,
  onModeChange,
}: PlaybackControlsProps) {
  const totalBars = Math.max(1, Math.ceil(durationBeats / beatsPerBar))
  const currentBar = Math.min(totalBars, Math.floor(currentBeat / beatsPerBar) + 1)

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {/* Seek scrubber */}
      <div className="flex items-center gap-3">
        <span className="w-16 text-right font-mono text-xs text-muted-foreground tabular-nums">
          Bar {currentBar}/{totalBars}
        </span>
        <input
          type="range"
          min={0}
          max={durationBeats}
          step={0.01}
          value={Math.min(currentBeat, durationBeats)}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-violet-200 accent-violet-600 dark:bg-violet-900/50"
          aria-label="Seek"
        />
      </div>

      {/* Transport row */}
      <div className="flex items-center justify-between gap-2">
        {/* View mode */}
        <ToggleGroup
          type="single"
          value={[mode]}
          onValueChange={(v) => {
            if (v.length) onModeChange(v[0] as ViewMode)
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="roll" className="gap-1 text-[11px]">
            <ListMusic size={13} />
            <span className="hidden sm:inline">Piano Roll</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="sheet" className="gap-1 text-[11px]">
            <Music size={13} />
            <span className="hidden sm:inline">Sheet</span>
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Transport */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onRestart} aria-label="Restart">
            <RotateCcw size={18} />
          </Button>
          <button
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              background: 'linear-gradient(to bottom, #8b5cf6, #7c3aed)',
              boxShadow: '0 3px 0 #5b21b6',
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform active:translate-y-0.5"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>
        </div>

        {/* Tempo */}
        <ToggleGroup
          type="single"
          value={[String(tempoScale)]}
          onValueChange={(v) => {
            if (v.length) onTempoChange(parseFloat(v[0]) as TempoScale)
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="0.5" className="text-[11px]">
            0.5×
          </ToggleGroupItem>
          <ToggleGroupItem value="0.75" className="text-[11px]">
            0.75×
          </ToggleGroupItem>
          <ToggleGroupItem value="1" className="text-[11px]">
            1×
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
