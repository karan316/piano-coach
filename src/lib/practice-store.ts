// Practice log storage: OPFS primary, IndexedDB fallback
// Both are persistent across page reloads. No data loss on refresh.

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

// ─── Storage Backends ──────────────────────────────────────────────

const OPFS_FILE = 'practice_log.json'
const IDB_NAME = 'piano-coach'
const IDB_STORE = 'practice-log'
const IDB_KEY = 'entries'

interface StorageBackend {
  read: () => Promise<PracticeEntry[]>
  write: (entries: PracticeEntry[]) => Promise<void>
}

/** OPFS backend */
function createOPFSBackend(): StorageBackend | null {
  if (typeof navigator === 'undefined' || !('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return null
  }
  return {
    async read() {
      const root = await navigator.storage.getDirectory()
      const handle = await root.getFileHandle(OPFS_FILE, { create: true })
      const file = await handle.getFile()
      const text = await file.text()
      if (!text.trim()) return []
      const parsed = JSON.parse(text) as unknown
      return Array.isArray(parsed) ? (parsed as PracticeEntry[]) : []
    },
    async write(entries) {
      const root = await navigator.storage.getDirectory()
      const handle = await root.getFileHandle(OPFS_FILE, { create: true })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(entries))
      await writable.close()
    },
  }
}

/** IndexedDB backend */
function createIDBBackend(): StorageBackend | null {
  if (typeof indexedDB === 'undefined') return null

  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return {
    async read() {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly')
        const store = tx.objectStore(IDB_STORE)
        const req = store.get(IDB_KEY)
        req.onsuccess = () => {
          const result = req.result as unknown
          resolve(Array.isArray(result) ? (result as PracticeEntry[]) : [])
        }
        req.onerror = () => reject(req.error)
      })
    },
    async write(entries) {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite')
        const store = tx.objectStore(IDB_STORE)
        const req = store.put(entries, IDB_KEY)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    },
  }
}

// ─── Practice Store ────────────────────────────────────────────────

class PracticeStore {
  private log: PracticeEntry[] = []
  private loaded = false
  private backend: StorageBackend | null = null
  private backendResolved = false

  /** Resolve the best available storage backend (OPFS > IndexedDB) */
  private async resolveBackend(): Promise<StorageBackend | null> {
    if (this.backendResolved) return this.backend

    // Try OPFS first
    const opfs = createOPFSBackend()
    if (opfs) {
      try {
        await opfs.read() // Test that it actually works
        this.backend = opfs
        this.backendResolved = true
        return this.backend
      } catch {
        // OPFS failed, fall through to IndexedDB
      }
    }

    // Try IndexedDB
    const idb = createIDBBackend()
    if (idb) {
      try {
        await idb.read() // Test that it actually works
        this.backend = idb
        this.backendResolved = true
        return this.backend
      } catch {
        // IndexedDB also failed
      }
    }

    // No persistent storage available — in-memory only
    this.backendResolved = true
    return null
  }

  /** Load the practice log from storage */
  async load(): Promise<PracticeEntry[]> {
    if (this.loaded) return this.log

    const backend = await this.resolveBackend()
    if (backend) {
      try {
        this.log = await backend.read()
      } catch (err) {
        console.warn('Failed to read practice log:', err)
      }
    }

    this.loaded = true
    return this.log
  }

  /** Append a new entry and persist */
  async appendEntry(entry: PracticeEntry): Promise<void> {
    this.log.push(entry)
    await this.persist()
  }

  /** Write the full log to storage */
  private async persist(): Promise<void> {
    const backend = await this.resolveBackend()
    if (!backend) return

    try {
      await backend.write(this.log)
    } catch (err) {
      console.warn('Failed to write practice log:', err)
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
