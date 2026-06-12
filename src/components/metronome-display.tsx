interface MetronomeDisplayProps {
  currentBeat: number
  running: boolean
  bpm: number
  timeSignature?: [number, number]
}

export function MetronomeDisplay({ currentBeat, running, bpm, timeSignature = [4, 4] }: MetronomeDisplayProps) {
  const beatsPerMeasure = timeSignature[0]
  const beatInMeasure = currentBeat >= 0 ? currentBeat % beatsPerMeasure : -1

  return (
    <div className="flex items-center gap-4">
      {/* Beat dots */}
      <div className="flex gap-2">
        {Array.from({ length: beatsPerMeasure }, (_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition-all duration-100 ${
              running && beatInMeasure === i
                ? i === 0
                  ? 'scale-125 bg-violet-500'
                  : 'scale-110 bg-violet-400'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* BPM display */}
      <span className="text-xs text-muted-foreground tabular-nums">{bpm} BPM</span>
    </div>
  )
}
