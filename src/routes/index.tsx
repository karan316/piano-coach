import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AppShell } from '#/components/app-shell'
import { ExerciseGrid } from '#/components/exercise-grid'
import { ExerciseView } from '#/components/exercise-view'
import { FreePlay } from '#/components/free-play'
import { StatsPanel } from '#/components/stats-panel'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [currentExercise, setCurrentExercise] = useState<string | null>(null)

  const handleSelectExercise = (id: string) => {
    setCurrentExercise(id)
  }

  const handleBack = () => {
    setCurrentExercise(null)
  }

  function renderContent() {
    if (!currentExercise) {
      return <ExerciseGrid onSelectExercise={handleSelectExercise} />
    }

    if (currentExercise === 'free-play') {
      return <FreePlay onBack={handleBack} />
    }

    if (currentExercise === 'practice-stats') {
      return <StatsPanel onBack={handleBack} />
    }

    return <ExerciseView exerciseId={currentExercise} onBack={handleBack} />
  }

  return (
    <AppShell>
      {renderContent()}
    </AppShell>
  )
}
