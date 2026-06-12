import { EXERCISE_ICON_MAP } from './exercise-icons'
import { Badge } from '#/components/ui/badge'

interface ExerciseCardProps {
  id: string
  name: string
  description: string
  level: string
  onSelect: () => void
}

const LEVEL_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
  beginner: { variant: 'secondary', label: 'Beginner' },
  'beginner+': { variant: 'secondary', label: 'Beginner+' },
  intermediate: { variant: 'outline', label: 'Intermediate' },
  'intermediate+': { variant: 'outline', label: 'Intermediate+' },
  all: { variant: 'secondary', label: 'All Levels' },
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
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

      {/* Level badge */}
      <Badge variant={levelConfig.variant}>
        {levelConfig.label}
      </Badge>

      {/* Hover musical note decoration */}
      <span className="absolute right-3 top-3 text-lg opacity-0 transition-opacity group-hover:opacity-30">♪</span>
    </button>
  )
}
