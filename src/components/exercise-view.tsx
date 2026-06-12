import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowLeft, Play, Volume2 } from 'lucide-react'
import { usePostHog } from '@posthog/react'
import { Button } from '#/components/ui/button'
import { getExercise } from '#/lib/game-logic'
import { noteNameToMidi, midiToLetter } from '#/lib/notes'
import { useGame } from '#/hooks/use-game'
import { useAudio } from '#/hooks/use-audio'
import { useMidi } from '#/hooks/use-midi'
import { useKeyboardInput } from '#/hooks/use-keyboard-input'
import { usePracticeLog } from '#/hooks/use-practice-log'
import { PianoKeyboard } from './piano-keyboard'
import { DashboardBar } from './dashboard-bar'
import { ExerciseSettings } from './exercise-settings'
import { FeedbackOverlay } from './feedback-overlay'
import { NotePrompt } from './note-prompt'
import { StaffPrompt } from './staff-prompt'
import { IntervalPrompt } from './interval-prompt'
import { ChordPrompt } from './chord-prompt'
import { EarTrainingPrompt } from './ear-training-prompt'
import { MultipleChoicePrompt } from './multiple-choice-prompt'
import { RhythmPrompt } from './rhythm-prompt'
import { KeySignatureDisplay } from './key-signature-display'

interface ExerciseViewProps {
  exerciseId: string
  onBack: () => void
}

function getStoredSetting<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  const stored = localStorage.getItem(key)
  if (stored === null) return fallback
  try {
    return JSON.parse(stored) as T
  } catch {
    return fallback
  }
}

export function ExerciseView({ exerciseId, onBack }: ExerciseViewProps) {
  const exercise = getExercise(exerciseId)
  if (!exercise)
    return (
      <div className="p-8 text-center text-gray-500">Exercise not found</div>
    )

  return <ExerciseViewInner exercise={exercise} onBack={onBack} />
}

function ExerciseViewInner({
  exercise,
  onBack,
}: {
  exercise: ReturnType<typeof getExercise> & {}
  onBack: () => void
}) {
  // Settings
  const [octaves, setOctaves] = useState(() =>
    getStoredSetting('piano-octaves', 2),
  )
  const [startOctave, setStartOctave] = useState(() =>
    getStoredSetting('piano-start-octave', 4),
  )
  const [showLabels, setShowLabels] = useState(() =>
    getStoredSetting('piano-labels', false),
  )
  const posthog = usePostHog()

  // Persist settings
  useEffect(() => {
    localStorage.setItem('piano-octaves', JSON.stringify(octaves))
  }, [octaves])
  useEffect(() => {
    localStorage.setItem('piano-start-octave', JSON.stringify(startOctave))
  }, [startOctave])
  useEffect(() => {
    localStorage.setItem('piano-labels', JSON.stringify(showLabels))
  }, [showLabels])

  // Hooks
  const audio = useAudio()
  const midi = useMidi()
  const keyboard = useKeyboardInput({ baseOctave: startOctave, enabled: true })
  const { stats, appendEntry } = usePracticeLog()
  const [hasListened, setHasListened] = useState(false)

  // Preload piano samples for the current octave range
  useEffect(() => {
    if (audio.mode === 'grand') {
      const startMidi = (startOctave + 1) * 12
      const endMidi = startMidi + octaves * 12
      void audio.preloadSamples(startMidi, endMidi)
    }
  }, [audio, startOctave, octaves])

  const game = useGame({
    exercise,
    stats,
    octave: startOctave,
    numOctaves: octaves,
    onCorrect: (entry) => {
      audio.playChime()
      void appendEntry({ exerciseId: exercise.id, ...entry, correct: true })
    },
    onIncorrect: (entry) => {
      audio.playBuzz()
      void appendEntry({ exerciseId: exercise.id, ...entry, correct: false })
    },
  })

  // Merge active notes from MIDI + keyboard
  const allActiveNotes = new Set([...midi.activeNotes, ...keyboard.activeKeys])

  // Build highlighted notes for piano display
  const highlightedNotes = new Map<number, 'correct' | 'incorrect' | 'prompt'>()
  if (game.phase === 'prompting' || game.phase === 'incorrect') {
    // For multiple-choice keyboard exercises, highlight the prompt keys on the main piano
    if (exercise.type === 'multiple-choice' && game.mcQuestion?.highlightKeys) {
      for (const k of game.mcQuestion.highlightKeys) {
        highlightedNotes.set(k, 'prompt')
      }
    }
  }

  // Handle note input from both MIDI and keyboard
  const handleNoteOn = useCallback(
    (midi_note: number) => {
      audio.startNote(midi_note)

      if (exercise.type === 'chord') {
        game.handleChordNoteOn(midi_note)
      } else {
        game.handleNotePlayed(midi_note)
      }
    },
    [audio, game, exercise.type],
  )

  const handleNoteOff = useCallback(
    (midi_note: number) => {
      audio.releaseNote(midi_note)
      if (exercise.type === 'chord') {
        game.handleChordNoteOff(midi_note)
      }
    },
    [audio, game, exercise.type],
  )

  // Subscribe to MIDI and keyboard events
  const midiHandlerRef = useRef(handleNoteOn)
  const midiOffHandlerRef = useRef(handleNoteOff)
  midiHandlerRef.current = handleNoteOn
  midiOffHandlerRef.current = handleNoteOff

  useEffect(() => {
    const unsubMidi = midi.onNoteOn((note) => midiHandlerRef.current(note))
    return unsubMidi
  }, [midi])

  useEffect(() => {
    const unsubOn = keyboard.onNoteOn((note) => midiHandlerRef.current(note))
    const unsubOff = keyboard.onNoteOff((note) =>
      midiOffHandlerRef.current(note),
    )
    return () => {
      unsubOn()
      unsubOff()
    }
  }, [keyboard])

  // Ear training: play the note
  const playEarNote = useCallback(() => {
    if (game.currentNoteWithOctave) {
      const earMidi = noteNameToMidi(game.currentNoteWithOctave)
      audio.playNote(earMidi, 1.2)
      setHasListened(true)
    }
  }, [game.currentNoteWithOctave, audio])

  // Reset hasListened on new prompt
  useEffect(() => {
    setHasListened(false)
  }, [game.currentNote])

  // Render the appropriate prompt
  function renderPrompt() {
    if (game.phase === 'idle') {
      return (
        <div className="flex flex-col items-center gap-5">
          <h2 className="font-display text-3xl text-foreground">
            {exercise.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {exercise.description}
          </p>
          <button
            onClick={() => {
              audio.init()
              game.start()
              posthog.capture('exercise_started', {
                exercise_id: exercise.id,
                exercise_type: exercise.type,
                exercise_level: exercise.level,
              })
            }}
            style={{
              background: 'linear-gradient(to bottom, #8b5cf6, #7c3aed)',
              boxShadow: '0 4px 0 #5b21b6',
              transition: 'transform 60ms ease-out, box-shadow 60ms ease-out',
            }}
            onPointerDown={(e) => {
              const el = e.currentTarget
              el.style.transform = 'translateY(3px)'
              el.style.boxShadow = '0 1px 0 #5b21b6'
            }}
            onPointerUp={(e) => {
              const el = e.currentTarget
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 4px 0 #5b21b6'
            }}
            onPointerLeave={(e) => {
              const el = e.currentTarget
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 4px 0 #5b21b6'
            }}
            className="inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-base font-semibold text-white select-none"
          >
            <Play size={20} />
            Start Exercise
          </button>
        </div>
      )
    }

    switch (exercise.type) {
      case 'single':
        if (exercise.showStaff) {
          return (
            <StaffPrompt
              note={game.currentNote}
              noteWithOctave={game.currentNoteWithOctave}
              phase={game.phase}
              showNoteName={exercise.id !== 'staff-reader'} // hide name for pure staff reading
            />
          )
        }
        return <NotePrompt note={game.currentNote} phase={game.phase} />

      case 'interval':
        return (
          <IntervalPrompt
            prompt={game.intervalPrompt}
            currentStep={game.intervalStep}
            phase={game.phase}
          />
        )

      case 'chord':
        return (
          <ChordPrompt
            notes={game.chordNotes}
            chordInfo={game.chordInfo}
            heldCount={game.heldChordNotes.size}
            phase={game.phase}
          />
        )

      case 'ear':
        return (
          <EarTrainingPrompt
            noteWithOctave={game.currentNoteWithOctave}
            phase={game.phase}
            onPlaySound={playEarNote}
            hasListened={hasListened}
          />
        )

      case 'multiple-choice': {
        const q = game.mcQuestion
        if (!q) return null

        // For ear exercises, add a play button
        const isEarExercise = exercise.id === 'ear-interval' || exercise.id === 'ear-chord' || exercise.id === 'ear-scale'

        return (
          <MultipleChoicePrompt
            question={q.prompt}
            choices={q.choices}
            correctAnswer={q.correctAnswer}
            phase={game.phase}
            onAnswer={game.handleMCAnswer}
          >
            {/* Key signature display */}
            {exercise.id === 'key-signature-id' && (q.keySigSharps || q.keySigFlats) && (
              <div className="text-foreground">
                <KeySignatureDisplay
                  keySignature={{
                    key: q.correctAnswer,
                    type: 'major',
                    sharps: q.keySigSharps ?? [],
                    flats: q.keySigFlats ?? [],
                  }}
                />
              </div>
            )}

            {/* Play button for ear exercises */}
            {isEarExercise && q.playNotes && (
              <button
                onClick={() => {
                  audio.init()
                  if (q.playSimultaneous) {
                    for (const n of q.playNotes!) audio.playNote(n, 1.5)
                  } else {
                    q.playNotes!.forEach((n, i) => {
                      setTimeout(() => audio.playNote(n, 0.8), i * 600)
                    })
                  }
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Volume2 size={24} />
              </button>
            )}
          </MultipleChoicePrompt>
        )
      }

      case 'rhythm':
        return (
          <RhythmPrompt
            octave={startOctave}
            phase={game.phase}
            onNoteHit={(timing, note) => {
              if (timing === 'perfect' || timing === 'good') {
                void appendEntry({ exerciseId: exercise.id, promptNote: note, playedNote: note, correct: true, reactionTimeMs: 0 })
              } else {
                void appendEntry({ exerciseId: exercise.id, promptNote: note, playedNote: '', correct: false, reactionTimeMs: 0 })
              }
            }}
            onComplete={() => {
              // Rhythm exercise manages its own flow
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Feedback overlay */}
      <FeedbackOverlay type={game.feedbackType} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div />

        <ExerciseSettings
          octaves={octaves}
          onOctavesChange={setOctaves}
          showLabels={showLabels}
          onShowLabelsChange={setShowLabels}
          startOctave={startOctave}
          onStartOctaveChange={setStartOctave}
          soundMode={audio.mode}
          onSoundModeChange={audio.setMode}
          dampDuration={audio.dampDuration}
          onDampDurationChange={audio.setDampDuration}
        />
      </div>

      {/* Dashboard bar (only when playing) */}
      {game.phase !== 'idle' && (
        <div className="px-4 pb-2">
          <DashboardBar
            streak={game.streak}
            accuracy={game.accuracy}
            lastReactionMs={game.lastReactionMs}
            sessionStartTime={game.sessionStartTime}
            totalAttempts={game.totalAttempts}
          />
        </div>
      )}

      {/* Prompt area */}
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        {renderPrompt()}
      </div>

      {/* Piano */}
      <div className="px-2 pb-3 sm:px-4 sm:pb-4">
        <PianoKeyboard
          startOctave={startOctave}
          numOctaves={octaves}
          activeNotes={allActiveNotes}
          highlightedNotes={highlightedNotes}
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          showLabels={showLabels}
        />
        {/* Octave indicator */}
        <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <span>
            C{startOctave}–C{startOctave + octaves}
          </span>
          <span className="text-gray-200 dark:text-gray-700">|</span>
          <span>
            <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] dark:bg-[#1A1525]">
              Z
            </kbd>
            <kbd className="ml-1 rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] dark:bg-[#1A1525]">
              X
            </kbd>{' '}
            octave
          </span>
        </div>
      </div>
    </div>
  )
}
