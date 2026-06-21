import { useState } from 'react'
import { Lightbulb, ChevronRight } from 'lucide-react'
import { getTipsForExercise } from '#/lib/lessons'
import { LessonIllustration } from './lesson-illustrations'

interface TipCardProps {
  exerciseId: string
}

/**
 * A friendly "did you know?" lesson card shown on the exercise start screen.
 * Picks a random starting tip relevant to the exercise and lets the learner
 * cycle through the rest.
 */
export function TipCard({ exerciseId }: TipCardProps) {
  const tips = getTipsForExercise(exerciseId)
  // Random starting index so the tip varies each visit
  const [index, setIndex] = useState(() => Math.floor(Math.random() * tips.length))
  const tip = tips[index]

  const nextTip = () => setIndex((i) => (i + 1) % tips.length)

  return (
    <div className="w-full max-w-md rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-purple-50/60 p-5 text-left shadow-sm dark:border-violet-800/50 dark:from-violet-900/20 dark:to-purple-900/10">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-500 dark:text-violet-400">
          <Lightbulb size={14} />
        </span>
        <span className="text-xs font-semibold tracking-wider text-violet-500 uppercase dark:text-violet-400">
          Tip
        </span>
      </div>

      {/* Illustration */}
      <div className="mb-4 flex items-center justify-center rounded-xl bg-white/60 px-3 py-3 dark:bg-black/20">
        <div className="w-full max-w-[260px]">
          <LessonIllustration id={tip.illustration} />
        </div>
      </div>

      {/* Text */}
      <h3 className="font-display text-lg text-foreground">{tip.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tip.body}</p>

      {/* Footer / cycle */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {tips.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-4 bg-violet-500' : 'w-1.5 bg-violet-300/60 dark:bg-violet-700/60'
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextTip}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-500/10 dark:text-violet-400"
        >
          Another tip
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
