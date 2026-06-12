import { useState, useEffect } from 'react'

interface MultipleChoicePromptProps {
  question: string
  choices: string[]
  correctAnswer: string
  phase: 'prompting' | 'correct' | 'incorrect' | 'idle'
  onAnswer: (choice: string) => void
  /** Optional content to render above the choices (e.g., keyboard highlight, staff) */
  children?: React.ReactNode
}

export function MultipleChoicePrompt({
  question,
  choices,
  correctAnswer,
  phase,
  onAnswer,
  children,
}: MultipleChoicePromptProps) {
  const [selected, setSelected] = useState<string | null>(null)

  // Reset selection on new prompt
  useEffect(() => {
    setSelected(null)
  }, [question, correctAnswer])

  const handleSelect = (choice: string) => {
    if (phase !== 'prompting') return
    setSelected(choice)
    onAnswer(choice)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        {question}
      </p>

      {children}

      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {choices.map((choice) => {
          let style = 'border-border bg-card text-card-foreground hover:bg-muted'
          if (phase === 'correct' || phase === 'incorrect') {
            if (choice === correctAnswer) {
              style = 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600'
            } else if (choice === selected && choice !== correctAnswer) {
              style = 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600'
            } else {
              style = 'border-border bg-card text-muted-foreground opacity-50'
            }
          }

          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              disabled={phase !== 'prompting'}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${style}`}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {phase === 'correct' && (
        <p className="text-sm text-emerald-500">Correct! ✓</p>
      )}
      {phase === 'incorrect' && (
        <p className="text-sm text-red-400">
          The answer was <span className="font-semibold">{correctAnswer}</span>
        </p>
      )}
    </div>
  )
}
