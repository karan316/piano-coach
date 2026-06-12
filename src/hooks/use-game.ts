import { useReducer, useCallback, useRef, useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import {
  selectNextNote,
  checkNoteMatch,
  checkChordMatch,
  generateInterval,
  generateChordPrompt,
  generateEarTrainingNote,
  type IntervalPrompt,
  type ChordInfo,
  type ExerciseConfig,
} from '#/lib/game-logic'
import { midiToLetter, noteNameToMidi } from '#/lib/notes'
import type { PracticeStats } from '#/lib/practice-store'

// ─── State Types ──────────────────────────────────────────────────────

export type GamePhase = 'idle' | 'prompting' | 'correct' | 'incorrect'

export interface GameState {
  phase: GamePhase
  currentNote: string // For single/ear: "E", for interval/chord: first note
  currentNoteWithOctave: string // "E4"
  intervalPrompt: IntervalPrompt | null
  intervalStep: number // 0 = first note, 1 = second note
  chordNotes: string[] // ["C4", "E4", "G4"]
  chordInfo: ChordInfo | null
  heldChordNotes: Set<number> // Currently held MIDI notes for chord detection
  streak: number
  totalCorrect: number
  totalAttempts: number
  lastReactionMs: number
  sessionStartTime: number
  feedbackType: 'correct' | 'incorrect' | null
}

type GameAction =
  | { type: 'START' }
  | { type: 'NEW_PROMPT'; note: string; noteWithOctave: string }
  | { type: 'NEW_INTERVAL'; prompt: IntervalPrompt }
  | { type: 'NEW_CHORD'; notes: string[]; chord: ChordInfo }
  | { type: 'NEW_EAR'; noteWithOctave: string }
  | { type: 'CORRECT'; reactionMs: number }
  | { type: 'INCORRECT' }
  | { type: 'INTERVAL_STEP_DONE' }
  | { type: 'UPDATE_HELD_NOTES'; notes: Set<number> }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'RESET' }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        phase: 'prompting',
        sessionStartTime: Date.now(),
        streak: 0,
        totalCorrect: 0,
        totalAttempts: 0,
      }
    case 'NEW_PROMPT':
      return {
        ...state,
        phase: 'prompting',
        currentNote: action.note,
        currentNoteWithOctave: action.noteWithOctave,
        feedbackType: null,
      }
    case 'NEW_INTERVAL':
      return {
        ...state,
        phase: 'prompting',
        intervalPrompt: action.prompt,
        intervalStep: 0,
        feedbackType: null,
        currentNote: action.prompt.note1,
      }
    case 'NEW_CHORD':
      return {
        ...state,
        phase: 'prompting',
        chordNotes: action.notes,
        chordInfo: action.chord,
        heldChordNotes: new Set(),
        feedbackType: null,
        currentNote: action.notes.join(', '),
      }
    case 'NEW_EAR':
      return {
        ...state,
        phase: 'prompting',
        currentNoteWithOctave: action.noteWithOctave,
        currentNote: action.noteWithOctave,
        feedbackType: null,
      }
    case 'CORRECT':
      return {
        ...state,
        phase: 'correct',
        streak: state.streak + 1,
        totalCorrect: state.totalCorrect + 1,
        totalAttempts: state.totalAttempts + 1,
        lastReactionMs: action.reactionMs,
        feedbackType: 'correct',
      }
    case 'INCORRECT':
      return {
        ...state,
        phase: 'incorrect',
        streak: 0,
        totalAttempts: state.totalAttempts + 1,
        feedbackType: 'incorrect',
      }
    case 'INTERVAL_STEP_DONE':
      return { ...state, intervalStep: 1 }
    case 'UPDATE_HELD_NOTES':
      return { ...state, heldChordNotes: action.notes }
    case 'CLEAR_FEEDBACK':
      return { ...state, feedbackType: null }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const initialState: GameState = {
  phase: 'idle',
  currentNote: '',
  currentNoteWithOctave: '',
  intervalPrompt: null,
  intervalStep: 0,
  chordNotes: [],
  chordInfo: null,
  heldChordNotes: new Set(),
  streak: 0,
  totalCorrect: 0,
  totalAttempts: 0,
  lastReactionMs: 0,
  sessionStartTime: 0,
  feedbackType: null,
}

// ─── Hook ─────────────────────────────────────────────────────────────

interface UseGameOptions {
  exercise: ExerciseConfig
  stats: PracticeStats | null
  octave: number
  onCorrect?: (entry: {
    promptNote: string
    playedNote: string
    reactionTimeMs: number
  }) => void
  onIncorrect?: (entry: {
    promptNote: string
    playedNote: string
    reactionTimeMs: number
  }) => void
}

export function useGame({
  exercise,
  stats,
  octave,
  onCorrect,
  onIncorrect,
}: UseGameOptions) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const promptTimeRef = useRef<number>(0)
  const previousNoteRef = useRef<string>('')
  const posthog = usePostHog()

  const accuracy =
    state.totalAttempts > 0 ? state.totalCorrect / state.totalAttempts : 0

  // Generate next prompt based on exercise type
  const nextPrompt = useCallback(() => {
    if (exercise.type === 'single') {
      const note = selectNextNote(
        exercise.notePool,
        stats,
        previousNoteRef.current,
      )
      previousNoteRef.current = note
      dispatch({ type: 'NEW_PROMPT', note, noteWithOctave: `${note}${octave}` })
    } else if (exercise.type === 'interval') {
      const prompt = generateInterval(exercise.notePool, octave)
      dispatch({ type: 'NEW_INTERVAL', prompt })
    } else if (exercise.type === 'chord') {
      const { notes, chord } = generateChordPrompt(octave)
      dispatch({ type: 'NEW_CHORD', notes, chord })
    } else if (exercise.type === 'ear') {
      const noteWithOctave = generateEarTrainingNote(exercise.notePool, octave)
      dispatch({ type: 'NEW_EAR', noteWithOctave })
    }
    promptTimeRef.current = performance.now()
  }, [exercise, stats, octave])

  // Start the game
  const start = useCallback(() => {
    dispatch({ type: 'START' })
    nextPrompt()
  }, [nextPrompt])

  // Handle a note being played
  const handleNotePlayed = useCallback(
    (midi: number) => {
      if (state.phase !== 'prompting' && state.phase !== 'incorrect') return

      const reactionMs = Math.round(performance.now() - promptTimeRef.current)
      const playedNote = midiToLetter(midi)

      if (exercise.type === 'single' || exercise.type === 'ear') {
        const promptNote =
          exercise.type === 'ear'
            ? midiToLetter(noteNameToMidi(state.currentNoteWithOctave))
            : state.currentNote

        if (checkNoteMatch(midi, promptNote)) {
          dispatch({ type: 'CORRECT', reactionMs })
          posthog.capture('exercise_answer_correct', {
            exercise_id: exercise.id,
            exercise_type: exercise.type,
            prompt_note: promptNote,
            played_note: playedNote,
            reaction_time_ms: reactionMs,
            streak: state.streak + 1,
          })
          onCorrect?.({ promptNote, playedNote, reactionTimeMs: reactionMs })
        } else if (state.phase === 'prompting') {
          dispatch({ type: 'INCORRECT' })
          posthog.capture('exercise_answer_incorrect', {
            exercise_id: exercise.id,
            exercise_type: exercise.type,
            prompt_note: promptNote,
            played_note: playedNote,
            reaction_time_ms: reactionMs,
          })
          onIncorrect?.({ promptNote, playedNote, reactionTimeMs: reactionMs })
        }
      } else if (exercise.type === 'interval') {
        const prompt = state.intervalPrompt
        if (!prompt) return

        const targetNote =
          state.intervalStep === 0 ? prompt.note1 : prompt.note2
        const targetLetter = midiToLetter(noteNameToMidi(targetNote))

        if (checkNoteMatch(midi, targetLetter)) {
          if (state.intervalStep === 0) {
            dispatch({ type: 'INTERVAL_STEP_DONE' })
          } else {
            dispatch({ type: 'CORRECT', reactionMs })
            posthog.capture('exercise_answer_correct', {
              exercise_id: exercise.id,
              exercise_type: exercise.type,
              prompt_note: `${prompt.note1}-${prompt.note2}`,
              played_note: playedNote,
              reaction_time_ms: reactionMs,
              streak: state.streak + 1,
            })
            onCorrect?.({
              promptNote: `${prompt.note1}-${prompt.note2}`,
              playedNote,
              reactionTimeMs: reactionMs,
            })
          }
        } else if (state.phase === 'prompting') {
          dispatch({ type: 'INCORRECT' })
          posthog.capture('exercise_answer_incorrect', {
            exercise_id: exercise.id,
            exercise_type: exercise.type,
            prompt_note: targetLetter,
            played_note: playedNote,
            reaction_time_ms: reactionMs,
          })
          onIncorrect?.({
            promptNote: targetLetter,
            playedNote,
            reactionTimeMs: reactionMs,
          })
        }
      }
    },
    [
      state.phase,
      state.currentNote,
      state.currentNoteWithOctave,
      state.intervalPrompt,
      state.intervalStep,
      exercise,
      onCorrect,
      onIncorrect,
    ],
  )

  // Handle chord: track held notes
  const handleChordNoteOn = useCallback(
    (midi: number) => {
      if (exercise.type !== 'chord') return
      if (state.phase !== 'prompting' && state.phase !== 'incorrect') return

      const reactionMs = Math.round(performance.now() - promptTimeRef.current)
      const newHeld = new Set(state.heldChordNotes)
      newHeld.add(midi)
      dispatch({ type: 'UPDATE_HELD_NOTES', notes: newHeld })

      if (checkChordMatch([...newHeld], state.chordNotes)) {
        dispatch({ type: 'CORRECT', reactionMs })
        posthog.capture('exercise_answer_correct', {
          exercise_id: exercise.id,
          exercise_type: exercise.type,
          prompt_note: state.chordNotes.join('+'),
          played_note: 'chord',
          reaction_time_ms: reactionMs,
          streak: state.streak + 1,
        })
        onCorrect?.({
          promptNote: state.chordNotes.join('+'),
          playedNote: 'chord',
          reactionTimeMs: reactionMs,
        })
      }
    },
    [
      exercise.type,
      state.phase,
      state.heldChordNotes,
      state.chordNotes,
      onCorrect,
    ],
  )

  const handleChordNoteOff = useCallback(
    (midi: number) => {
      if (exercise.type !== 'chord') return
      const newHeld = new Set(state.heldChordNotes)
      newHeld.delete(midi)
      dispatch({ type: 'UPDATE_HELD_NOTES', notes: newHeld })
    },
    [exercise.type, state.heldChordNotes],
  )

  // Auto-advance after correct answer
  useEffect(() => {
    if (state.phase === 'correct') {
      const timer = setTimeout(() => {
        nextPrompt()
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [state.phase, nextPrompt])

  // Clear feedback after timeout
  useEffect(() => {
    if (state.feedbackType) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_FEEDBACK' })
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [state.feedbackType])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    ...state,
    accuracy,
    start,
    nextPrompt,
    handleNotePlayed,
    handleChordNoteOn,
    handleChordNoteOff,
    reset,
  }
}
