import { EXERCISE_ICON_MAP } from './exercise-icons'
import { Badge } from '#/components/ui/badge'

interface ExerciseCardProps {
  id: string
  name: string
  description: string
  level: string
  onSelect: () => void
}

const LEVEL_CONFIG: Record<string, { className: string; label: string }> = {
  beginner: { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Beginner' },
  'beginner+': { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', label: 'Beginner+' },
  intermediate: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: 'Intermediate' },
  'intermediate+': { className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', label: 'Intermediate+' },
  all: { className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400', label: 'All Levels' },
}

export function ExerciseCard({ id, name, description, level, onSelect }: ExerciseCardProps) {
  const IconComponent = EXERCISE_ICON_MAP[id]
  const levelConfig = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.all

  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md"
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 text-violet-500 transition-colors group-hover:from-violet-100 group-hover:to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 dark:text-violet-400 dark:group-hover:from-violet-900/50 dark:group-hover:to-purple-900/50">
        {IconComponent && <IconComponent size={40} />}
      </div>

      {/* Name */}
      <h3 className="font-display text-lg text-card-foreground">{name}</h3>

      {/* Description */}
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>

      {/* Level badge */}
      <Badge className={`mt-auto ${levelConfig.className}`}>
        {levelConfig.label}
      </Badge>

      {/* Hover musical note decoration */}
      <span className="absolute right-3 top-3 text-lg opacity-0 transition-opacity group-hover:opacity-30">♪</span>
    </button>
  )
}
