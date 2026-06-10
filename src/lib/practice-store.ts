// OPFS (Origin Private File System) practice log storage with in-memory fallback

export interface PracticeEntry {
  timestamp: number
  exerciseId: string
  promptNote: string // The note the user was asked to play
  playedNote: string // The note the user actually played
  correct: boolean
  reactionTimeMs: number
}

export interface NoteStats {
  note: string
  attempts: number
  correct: number
  accuracy: number
  avgReactionMs: number
}

export interface PracticeStats {
  totalAttempts: number
  totalCorrect: number
  accuracy: number
  avgReactionMs: number
  byNote: NoteStats[]
  byExercise: Record<string, { attempts: number; correct: number; accuracy: number }>
  weakNotes: string[] // Notes with accuracy < 70% or reaction > 3s
  streak: number // Current streak
  bestStreak: number
}

const LOG_FILE_NAME = 'practice_log.json'

class PracticeStore {
  private log: PracticeEntry[] = []
  private loaded = false
  private opfsAvailable: boolean | null = null

  /** Check if OPFS is available */
  private async checkOPFS(): Promise<boolean> {
    if (this.opfsAvailable !== null) return this.opfsAvailable
    try {
      if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
        this.opfsAvailable = false
        return false
      }
      await navigator.storage.getDirectory()
      this.opfsAvailable = true
      return true
    } catch {
      this.opfsAvailable = false
      return false
    }
  }

  /** Load the practice log from OPFS (or initialize empty) */
  async load(): Promise<PracticeEntry[]> {
    if (this.loaded) return this.log

    const hasOPFS = await this.checkOPFS()
    if (!hasOPFS) {
      this.loaded = true
      return this.log
    }

    try {
      const root = await navigator.storage.getDirectory()
      const fileHandle = await root.getFileHandle(LOG_FILE_NAME, { create: true })
      const file = await fileHandle.getFile()
      const text = await file.text()

      if (text.trim()) {
        const parsed = JSON.parse(text) as unknown
        if (Array.isArray(parsed)) {
          this.log = parsed as PracticeEntry[]
        }
      }
    } catch (err) {
      console.warn('Failed to read practice log from OPFS:', err)
    }

    this.loaded = true
    return this.log
  }

  /** Append a new entry and persist to OPFS */
  async appendEntry(entry: PracticeEntry): Promise<void> {
    this.log.push(entry)
    await this.persist()
  }

  /** Write the full log back to OPFS */
  private async persist(): Promise<void> {
    const hasOPFS = await this.checkOPFS()
    if (!hasOPFS) return

    try {
      const root = await navigator.storage.getDirectory()
      const fileHandle = await root.getFileHandle(LOG_FILE_NAME, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(this.log))
      await writable.close()
    } catch (err) {
      console.warn('Failed to write practice log to OPFS:', err)
    }
  }

  /** Compute stats from the current log */
  getStats(): PracticeStats {
    const entries = this.log
    const totalAttempts = entries.length
    const totalCorrect = entries.filter((e) => e.correct).length
    const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0

    const reactionTimes = entries.filter((e) => e.correct).map((e) => e.reactionTimeMs)
    const avgReactionMs =
      reactionTimes.length > 0
        ? reactionTimes.reduce((sum, t) => sum + t, 0) / reactionTimes.length
        : 0

    // Per-note stats
    const noteMap = new Map<string, { attempts: number; correct: number; totalReaction: number }>()
    for (const entry of entries) {
      const key = entry.promptNote
      const existing = noteMap.get(key) ?? { attempts: 0, correct: 0, totalReaction: 0 }
      existing.attempts++
      if (entry.correct) {
        existing.correct++
        existing.totalReaction += entry.reactionTimeMs
      }
      noteMap.set(key, existing)
    }

    const byNote: NoteStats[] = Array.from(noteMap.entries()).map(([note, data]) => ({
      note,
      attempts: data.attempts,
      correct: data.correct,
      accuracy: data.attempts > 0 ? data.correct / data.attempts : 0,
      avgReactionMs: data.correct > 0 ? data.totalReaction / data.correct : 0,
    }))

    // Per-exercise stats
    const exerciseMap = new Map<string, { attempts: number; correct: number }>()
    for (const entry of entries) {
      const existing = exerciseMap.get(entry.exerciseId) ?? { attempts: 0, correct: 0 }
      existing.attempts++
      if (entry.correct) existing.correct++
      exerciseMap.set(entry.exerciseId, existing)
    }

    const byExercise: Record<string, { attempts: number; correct: number; accuracy: number }> = {}
    for (const [id, data] of exerciseMap) {
      byExercise[id] = {
        ...data,
        accuracy: data.attempts > 0 ? data.correct / data.attempts : 0,
      }
    }

    // Weak notes: accuracy < 70% or average reaction > 3s (with min 3 attempts)
    const weakNotes = byNote
      .filter((n) => n.attempts >= 3 && (n.accuracy < 0.7 || n.avgReactionMs > 3000))
      .map((n) => n.note)

    // Current streak (from end of log)
    let streak = 0
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].correct) streak++
      else break
    }

    // Best streak
    let bestStreak = 0
    let currentRun = 0
    for (const entry of entries) {
      if (entry.correct) {
        currentRun++
        if (currentRun > bestStreak) bestStreak = currentRun
      } else {
        currentRun = 0
      }
    }

    return {
      totalAttempts,
      totalCorrect,
      accuracy,
      avgReactionMs,
      byNote,
      byExercise,
      weakNotes,
      streak,
      bestStreak,
    }
  }

  /** Get recent entries for a specific exercise */
  getRecentEntries(exerciseId: string, count = 20): PracticeEntry[] {
    return this.log.filter((e) => e.exerciseId === exerciseId).slice(-count)
  }

  /** Get the full log */
  getLog(): PracticeEntry[] {
    return [...this.log]
  }

  /** Clear all data */
  async clear(): Promise<void> {
    this.log = []
    await this.persist()
  }
}

// Singleton
export const practiceStore = new PracticeStore()
