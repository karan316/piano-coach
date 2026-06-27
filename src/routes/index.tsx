import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { usePostHog } from '@posthog/react'
import { AppShell } from '#/components/app-shell'
import { ExerciseGrid } from '#/components/exercise-grid'
import { ExerciseView } from '#/components/exercise-view'
import { FreePlay } from '#/components/free-play'
import { StatsPanel } from '#/components/stats-panel'
import { SongLibrary } from '#/components/song-library'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [currentExercise, setCurrentExercise] = useState<string | null>(null)
  const posthog = usePostHog()

  const handleSelectExercise = (id: string) => {
    if (id === 'free-play') {
      posthog.capture('free_play_started')
    } else if (id === 'practice-stats') {
      posthog.capture('stats_viewed')
    } else if (id === 'song-library') {
      posthog.capture('song_library_opened')
    } else {
      posthog.capture('exercise_selected', { exercise_id: id })
    }
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

    if (currentExercise === 'song-library') {
      return <SongLibrary onBack={handleBack} />
    }

    return <ExerciseView exerciseId={currentExercise} onBack={handleBack} />
  }

  return <AppShell>{renderContent()}</AppShell>
}
