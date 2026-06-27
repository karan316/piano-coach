import { Settings } from 'lucide-react'
import type { PianoMode } from '#/lib/audio-engine'
import { Button } from '#/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover'
import { Slider } from '#/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

interface SongSettingsProps {
  soundMode: PianoMode
  onSoundModeChange: (m: PianoMode) => void
  dampDuration: number
  onDampDurationChange: (d: number) => void
}

export function SongSettings({
  soundMode,
  onSoundModeChange,
  dampDuration,
  onDampDurationChange,
}: SongSettingsProps) {
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
          Playback Settings
        </h4>

        {/* Damp duration — how long notes ring */}
        <div className="mb-3">
          <label className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Note Sustain</span>
            <span className="font-mono text-foreground">{dampDuration.toFixed(1)}s</span>
          </label>
          <Slider
            value={[dampDuration]}
            onValueChange={(v) => onDampDurationChange(v[0])}
            min={0.3}
            max={5}
            step={0.1}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Staccato</span>
            <span>Pedaled</span>
          </div>
        </div>

        {/* Sound mode */}
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Sound</label>
          <ToggleGroup
            type="single"
            value={[soundMode]}
            onValueChange={(v) => {
              if (v.length) onSoundModeChange(v[0] as PianoMode)
            }}
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
