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
    description: 'Explore the keyboard freely — no scoring, just play',
    level: 'all' as const,
  },
  {
    id: 'practice-stats',
    name: 'Practice Stats',
    description: 'Review your progress and find weak spots',
    level: 'all' as const,
  },
]

export function ExerciseGrid({ onSelectExercise }: ExerciseGridProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl text-gray-900 dark:text-gray-100">Choose an Exercise</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Pick a skill to practice — each exercise adapts to your level
        </p>
      </div>

      {/* Exercise cards grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {EXERCISES.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            id={exercise.id}
            name={exercise.name}
            description={exercise.description}
            level={exercise.level}
            onSelect={() => onSelectExercise(exercise.id)}
          />
        ))}
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

      {/* Keyboard hint */}
      <div className="mt-8 text-center">
        <p className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
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
