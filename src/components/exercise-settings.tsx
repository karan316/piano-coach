import { Settings } from 'lucide-react'
import type { PianoMode } from '#/lib/audio-engine'
import { Button } from '#/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { Switch } from '#/components/ui/switch'
import { Slider } from '#/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

interface ExerciseSettingsProps {
  octaves: number
  onOctavesChange: (n: number) => void
  showLabels: boolean
  onShowLabelsChange: (v: boolean) => void
  startOctave: number
  onStartOctaveChange: (o: number) => void
  soundMode: PianoMode
  onSoundModeChange: (m: PianoMode) => void
  dampDuration: number
  onDampDurationChange: (d: number) => void
}

export function ExerciseSettings({
  octaves,
  onOctavesChange,
  showLabels,
  onShowLabelsChange,
  startOctave,
  onStartOctaveChange,
  soundMode,
  onSoundModeChange,
  dampDuration,
  onDampDurationChange,
}: ExerciseSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm">
            <Settings size={14} />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        }
      />

      <PopoverContent align="end" sideOffset={8} className="w-60 p-3">
        <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Piano Settings
        </h4>

        {/* Octave range */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-muted-foreground">Octave Range</label>
          <ToggleGroup
            type="single"
            value={[octaves]}
            onValueChange={(v) => { if (v.length) onOctavesChange(v[0] as number) }}
            className="w-full"
            variant="outline"
            size="sm"
            spacing={0}
          >
            {[2, 3, 4].map((n) => (
              <ToggleGroupItem key={n} value={n} className="flex-1 text-xs">
                {n}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Start octave */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-muted-foreground">Starting Octave</label>
          <ToggleGroup
            type="single"
            value={[startOctave]}
            onValueChange={(v) => { if (v.length) onStartOctaveChange(v[0] as number) }}
            className="w-full"
            variant="outline"
            size="sm"
            spacing={0}
          >
            {[2, 3, 4, 5].map((o) => (
              <ToggleGroupItem key={o} value={o} className="flex-1 text-xs">
                C{o}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Note labels toggle */}
        <div className="mb-3 flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Show Note Labels</label>
          <Switch
            checked={showLabels}
            onCheckedChange={onShowLabelsChange}
            size="sm"
          />
        </div>

        {/* Damp duration */}
        <div className="mb-3">
          <label className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Damping</span>
            <span className="font-mono text-foreground">{dampDuration.toFixed(1)}s</span>
          </label>
          <Slider
            value={[dampDuration]}
            onValueChange={(v) => onDampDurationChange(v[0])}
            min={0.2}
            max={5}
            step={0.1}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Short</span>
            <span>Long</span>
          </div>
        </div>

        {/* Sound mode */}
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Sound</label>
          <ToggleGroup
            type="single"
            value={[soundMode]}
            onValueChange={(v) => { if (v.length) onSoundModeChange(v[0] as PianoMode) }}
            className="w-full"
            variant="outline"
            size="sm"
            spacing={0}
          >
            <ToggleGroupItem value="grand" className="flex-1 text-xs">
              🎹 Grand
            </ToggleGroupItem>
            <ToggleGroupItem value="electric" className="flex-1 text-xs">
              ⚡ Electric
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  )
}
