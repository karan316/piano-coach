import { useState, useCallback, useEffect, useRef } from 'react'
import { Play, Square } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Slider } from '#/components/ui/slider'
import { MetronomeDisplay } from './metronome-display'
import { useMetronome } from '#/hooks/use-metronome'
import { generateRhythmPattern, checkTiming, type RhythmPattern } from '#/lib/rhythm-patterns'
import { formatNoteDisplay, midiToLetter } from '#/lib/notes'

interface RhythmPromptProps {
  octave: number
  phase: 'prompting' | 'correct' | 'incorrect' | 'idle'
  onNoteHit: (timing: 'perfect' | 'good' | 'late' | 'early' | 'miss', note: string) => void
  onComplete: (score: number) => void
}

export function RhythmPrompt({ octave, phase, onNoteHit, onComplete }: RhythmPromptProps) {
  const metro = useMetronome()
  const [pattern, setPattern] = useState<RhythmPattern | null>(null)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)
  const [results, setResults] = useState<Array<{ timing: string; note: string }>>([])
  const [started, setStarted] = useState(false)
  const patternRef = useRef(pattern)
  patternRef.current = pattern

  // Generate new pattern
  const newPattern = useCallback(() => {
    const p = generateRhythmPattern(difficulty, octave)
    setPattern(p)
    setCurrentNoteIndex(0)
    setResults([])
    setStarted(false)
  }, [difficulty, octave])

  // Set initial BPM from pattern when difficulty changes
  useEffect(() => {
    const p = generateRhythmPattern(difficulty, octave)
    setPattern(p)
    setCurrentNoteIndex(0)
    setResults([])
    setStarted(false)
    // Don't override user's BPM setting
  }, [difficulty, octave])

  // Check if pattern is complete
  useEffect(() => {
    if (pattern && currentNoteIndex >= pattern.notes.length && started) {
      metro.stop()
      setStarted(false)
      const score = results.filter((r) => r.timing === 'perfect' || r.timing === 'good').length
      onComplete(score)
    }
  }, [currentNoteIndex, pattern, started, metro, results, onComplete])

  const [countdown, setCountdown] = useState(-1)
  const countdownRef = useRef(-1)

  // Monitor beats to advance expected note
  useEffect(() => {
    if (!started || !pattern) return

    // During countdown, don't check notes
    if (countdown > 0) return

    const currentNote = pattern.notes[currentNoteIndex]
    if (!currentNote) return

    // Offset beat position by 4 (countdown beats)
    const adjustedBeat = metro.currentBeat - 4
    if (adjustedBeat > currentNote.beatPosition + currentNote.duration) {
      setResults((prev) => [...prev, { timing: 'miss', note: currentNote.note }])
      onNoteHit('miss', currentNote.note)
      setCurrentNoteIndex((prev) => prev + 1)
    }
  }, [metro.currentBeat, started, pattern, currentNoteIndex, onNoteHit, countdown])

  // Handle countdown beats
  useEffect(() => {
    if (!started || countdown < 0) return
    if (metro.currentBeat < 4) {
      setCountdown(4 - metro.currentBeat)
    } else if (countdown > 0) {
      setCountdown(0)
    }
  }, [metro.currentBeat, started, countdown])

  const handleStart = () => {
    setCurrentNoteIndex(0)
    setResults([])
    setCountdown(4)
    countdownRef.current = 4
    setStarted(true)
    metro.start()
  }

  const handleStop = () => {
    metro.stop()
    setStarted(false)
    setCountdown(-1)
  }

  // This will be called from exercise-view when a note is played
  const handleNoteInput = useCallback((midi: number) => {
    if (!started || !patternRef.current || countdown > 0) return
    const pat = patternRef.current
    const note = pat.notes[currentNoteIndex]
    if (!note) return

    const expectedTime = metro.getBeatTime(note.beatPosition + 4) // offset by countdown
    const timing = checkTiming(expectedTime, performance.now(), pat.bpm)
    const playedLetter = midiToLetter(midi)

    // Check pitch too
    const expectedLetter = midiToLetter(note.midi)
    const pitchCorrect = playedLetter === expectedLetter

    const finalTiming = pitchCorrect ? timing : 'miss'
    setResults((prev) => [...prev, { timing: finalTiming, note: note.note }])
    onNoteHit(finalTiming, note.note)
    setCurrentNoteIndex((prev) => prev + 1)
  }, [started, currentNoteIndex, metro, onNoteHit])

  if (!pattern) return null

  const currentNote = pattern.notes[currentNoteIndex]

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Play in time with the beat
      </p>

      {/* Metronome */}
      <MetronomeDisplay
        currentBeat={metro.currentBeat}
        running={metro.running}
        bpm={Number.isFinite(metro.bpm) ? metro.bpm : 80}
        timeSignature={pattern.timeSignature}
      />

      {/* BPM slider */}
      {!started && (
        <div className="w-48">
          <Slider
            value={[Number.isFinite(metro.bpm) ? metro.bpm : 80]}
            onValueChange={(v) => metro.setBpm(v[0])}
            min={40}
            max={160}
            step={5}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>
      )}

      {/* Countdown */}
      {started && countdown > 0 && (
        <div className="text-center">
          <div className="font-display text-6xl text-violet-500 animate-note-appear">
            {countdown}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Get ready...</p>
        </div>
      )}

      {/* Current note to play */}
      {started && countdown <= 0 && currentNote && (
        <div className="text-center">
          <div className="font-display text-5xl text-foreground animate-note-appear">
            {formatNoteDisplay(midiToLetter(currentNote.midi))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {currentNoteIndex + 1} / {pattern.notes.length}
          </p>
        </div>
      )}

      {/* Progress */}
      {started && (
        <div className="flex gap-1">
          {pattern.notes.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-4 rounded-full ${
                i < results.length
                  ? results[i].timing === 'perfect' || results[i].timing === 'good'
                    ? 'bg-emerald-500'
                    : results[i].timing === 'early' || results[i].timing === 'late'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  : i === currentNoteIndex
                    ? 'bg-violet-400 animate-pulse'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      )}

      {/* Difficulty + Start/Stop */}
      {!started ? (
        <div className="flex items-center gap-3">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
          >
            <option value="easy">Easy (Whole notes)</option>
            <option value="medium">Medium (Half notes)</option>
            <option value="hard">Hard (Quarter notes)</option>
          </select>
          <Button size="sm" onClick={handleStart}>
            <Play size={14} />
            Start
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={handleStop}>
          <Square size={14} />
          Stop
        </Button>
      )}

      {/* Score after completion */}
      {!started && results.length > 0 && (
        <div className="text-center">
          <p className="font-display text-lg text-emerald-500">
            {results.filter((r) => r.timing === 'perfect' || r.timing === 'good').length} / {results.length} on time
          </p>
          <Button variant="ghost" size="sm" onClick={newPattern} className="mt-2">
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}

// Export handleNoteInput for exercise-view to call
export type RhythmPromptHandle = {
  handleNoteInput: (midi: number) => void
}
