import { EXERCISE_ICON_MAP } from './exercise-icons'

interface ExerciseCardProps {
  id: string
  name: string
  description: string
  level: string
  onSelect: () => void
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'Beginner' },
  'beginner+': { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', label: 'Beginner+' },
  intermediate: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', label: 'Intermediate' },
  'intermediate+': { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', label: 'Intermediate+' },
  all: { bg: 'bg-gray-100 dark:bg-gray-800/60', text: 'text-gray-600 dark:text-gray-400', label: 'All Levels' },
}

export function ExerciseCard({ id, name, description, level, onSelect }: ExerciseCardProps) {
  const IconComponent = EXERCISE_ICON_MAP[id]
  const levelStyle = LEVEL_STYLES[level] ?? LEVEL_STYLES.all

  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md dark:border-gray-700/50 dark:bg-gray-800/80 dark:hover:border-gray-600 dark:hover:bg-gray-800"
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-500 transition-colors group-hover:from-orange-100 group-hover:to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-400 dark:group-hover:from-orange-900/50 dark:group-hover:to-amber-900/50">
        {IconComponent && <IconComponent size={40} />}
      </div>

      {/* Name */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{name}</h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>

      {/* Level badge */}
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyle.bg} ${levelStyle.text}`}>
        {levelStyle.label}
      </span>

      {/* Hover musical note decoration */}
      <span className="absolute right-3 top-3 text-lg opacity-0 transition-opacity group-hover:opacity-30">♪</span>
    </button>
  )
}
