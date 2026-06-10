interface FeedbackOverlayProps {
  type: 'correct' | 'incorrect' | null
}

export function FeedbackOverlay({ type }: FeedbackOverlayProps) {
  if (!type) return null

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 animate-feedback-flash ${
        type === 'correct'
          ? 'bg-emerald-400/15 dark:bg-emerald-400/10'
          : 'bg-red-400/15 dark:bg-red-400/10'
      }`}
      aria-hidden="true"
    />
  )
}
