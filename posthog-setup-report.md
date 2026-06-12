# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Piano Coach, a TanStack Start piano practice app. The integration covers client-side event tracking across all key user interactions: choosing and starting exercises, tracking answer correctness, measuring reaction times, detecting MIDI device connections, and monitoring practice data management. PostHog is initialized via `PostHogProvider` in the root route, with a Vite reverse proxy configured for reliable event ingestion. Environment variables are used throughout — no keys are hardcoded.

| Event | Description | File |
|---|---|---|
| `exercise_selected` | User selects an exercise from the exercise grid | `src/routes/index.tsx` |
| `exercise_started` | User clicks 'Start Exercise' to begin a session | `src/components/exercise-view.tsx` |
| `exercise_answer_correct` | User plays the correct note or chord | `src/hooks/use-game.ts` |
| `exercise_answer_incorrect` | User plays an incorrect note | `src/hooks/use-game.ts` |
| `free_play_started` | User enters free play mode | `src/routes/index.tsx` |
| `stats_viewed` | User opens the practice stats panel | `src/routes/index.tsx` |
| `midi_device_connected` | A MIDI device is successfully connected | `src/lib/midi-manager.ts` |
| `practice_data_cleared` | User clears their practice history | `src/components/stats-panel.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/467445/dashboard/1704656)
- [Exercise Sessions Over Time](https://us.posthog.com/project/467445/insights/4n1RQEux) — Daily count of exercise sessions started
- [Correct vs Incorrect Answers](https://us.posthog.com/project/467445/insights/NkIWKnEq) — Track answer accuracy trends over time
- [Most Popular Exercises](https://us.posthog.com/project/467445/insights/TWQ2YYfM) — Bar chart of exercise starts by exercise type
- [Exercise Engagement Funnel](https://us.posthog.com/project/467445/insights/6jM5Xb1Y) — Conversion funnel from exercise_selected → exercise_started → first correct answer
- [Average Reaction Time by Exercise](https://us.posthog.com/project/467445/insights/vHma7Uso) — How quickly users respond correctly across different exercise types

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
