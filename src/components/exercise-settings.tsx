import { useState } from 'react'
import { Settings, ChevronDown } from 'lucide-react'
import type { PianoMode } from '#/lib/audio-engine'

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
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-200 dark:bg-[#1A1525] dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <Settings size={14} />
        <span className="hidden sm:inline">Settings</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-purple-800/30 dark:bg-[#1A1525]">
            <h4 className="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Piano Settings
            </h4>

            {/* Octave range */}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Octave Range</label>
              <div className="flex gap-1">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => onOctavesChange(n)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      octaves === n
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-[#241E35] dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Start octave */}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Starting Octave</label>
              <div className="flex gap-1">
                {[2, 3, 4, 5].map((o) => (
                  <button
                    key={o}
                    onClick={() => onStartOctaveChange(o)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      startOctave === o
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-[#241E35] dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                  >
                    C{o}
                  </button>
                ))}
              </div>
            </div>

            {/* Note labels toggle */}
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs text-gray-600 dark:text-gray-300">Show Note Labels</label>
              <button
                onClick={() => onShowLabelsChange(!showLabels)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  showLabels ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    showLabels ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Damp duration */}
            <div className="mb-3">
              <label className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>Damping</span>
                <span className="font-mono text-violet-600 dark:text-violet-400">{dampDuration.toFixed(1)}s</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="5"
                step="0.1"
                value={dampDuration}
                onChange={(e) => onDampDurationChange(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-violet-500 dark:bg-[#241E35]"
              />
              <div className="mt-0.5 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>Short</span>
                <span>Long</span>
              </div>
            </div>

            {/* Sound mode */}
            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Sound</label>
              <div className="flex gap-1">
                {([['grand', '🎹 Grand'], ['electric', '⚡ Electric']] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => onSoundModeChange(mode)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      soundMode === mode
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-[#241E35] dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
