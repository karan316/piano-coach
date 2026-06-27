import { createFileRoute, useRouter, useCanGoBack } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { AppShell } from '#/components/app-shell'
import { ExerciseGrid } from '#/components/exercise-grid'
import { ExerciseView } from '#/components/exercise-view'
import { FreePlay } from '#/components/free-play'
import { StatsPanel } from '#/components/stats-panel'
import { SongLibrary } from '#/components/song-library'
import { SongPlayer } from '#/components/song-player'
import { getSong } from '#/lib/songs'

interface HomeSearch {
  view?: string
  song?: string
}

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const view = search.view
    const song = search.song
    return {
      ...(typeof view === 'string' && view.length > 0 ? { view } : {}),
      ...(typeof song === 'string' && song.length > 0 ? { song } : {}),
    }
  },
})

function Home() {
  const { view, song } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const posthog = usePostHog()

  const currentExercise = view ?? null

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
    // Push a history entry so the browser back button returns to the grid
    void navigate({ search: { view: id } })
  }

  const handleSelectSong = (songId: string) => {
    posthog.capture('song_selected', { song_id: songId })
    // Push a nested entry so back returns to the song list
    void navigate({ search: { view: 'song-library', song: songId } })
  }

  const handleBack = () => {
    if (canGoBack) {
      router.history.back()
    } else {
      void navigate({ to: '/', search: {} })
    }
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
      const selectedSong = song ? getSong(song) : undefined
      if (selectedSong) {
        return <SongPlayer song={selectedSong} onBack={handleBack} />
      }
      return <SongLibrary onSelectSong={handleSelectSong} onBack={handleBack} />
    }

    return <ExerciseView exerciseId={currentExercise} onBack={handleBack} />
  }

  return <AppShell>{renderContent()}</AppShell>
}
