import { ExerciseCard } from './exercise-card'
import { EXERCISES } from '#/lib/game-logic'

interface ExerciseGridProps {
  onSelectExercise: (exerciseId: string) => void
}

// Extra cards for Free Play and Stats (not game exercises)
const EXTRA_CARDS = [
  {
    id: 'free-play',
    name: 'Free Play',
    description: 'Explore the keyboard freely, no scoring',
    level: 'all' as const,
  },
  {
    id: 'practice-stats',
    name: 'Practice Stats',
    description: 'Review your progress and find weak spots',
    level: 'all' as const,
  },
]

const CATEGORIES = [
  { key: 'notes', label: 'Note Reading' },
  { key: 'intervals', label: 'Intervals & Chords' },
  { key: 'ear', label: 'Ear Training' },
  { key: 'rhythm', label: 'Rhythm' },
] as const

export function ExerciseGrid({ onSelectExercise }: ExerciseGridProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl text-foreground">Choose an Exercise</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a skill to practice. Each exercise adapts to your level.
        </p>
      </div>

      {/* Exercises by category */}
      {CATEGORIES.map((cat) => {
        const exercises = EXERCISES.filter((e) => e.category === cat.key)
        if (exercises.length === 0) return null
        return (
          <div key={cat.key} className="mb-6">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{cat.label}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  id={exercise.id}
                  name={exercise.name}
                  description={exercise.description}
                  level={exercise.level}
                  onSelect={() => onSelectExercise(exercise.id)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Tools section */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Songs</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <ExerciseCard
            id="song-library"
            name="Song Player"
            description="Practice full songs with a piano roll or sheet music"
            level="all"
            onSelect={() => onSelectExercise('song-library')}
          />
        </div>
      </div>

      {/* Tools section */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Tools</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {EXTRA_CARDS.map((card) => (
            <ExerciseCard
              key={card.id}
              id={card.id}
              name={card.name}
              description={card.description}
              level={card.level}
              onSelect={() => onSelectExercise(card.id)}
            />
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="mt-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-xs text-gray-500 dark:bg-[#1A1525] dark:text-gray-400">
          <span className="font-mono">A S D F G H J K</span>
          <span>= Piano keys</span>
          <span className="mx-1 text-gray-300 dark:text-gray-600">|</span>
          <span className="font-mono">Z X</span>
          <span>= Octave ↓↑</span>
        </p>
      </div>
    </div>
  )
}
