export type GatedProgress = {
  maxWatchedTime: number
  completed: boolean
}

export const POST_AGENDA_PROGRESS_PREFIX = 'te-post-agenda'

export function gatedStorageKey(scope: string): string {
  return `${POST_AGENDA_PROGRESS_PREFIX}:${scope}`
}

export function clampSeek(nextTime: number, maxWatchedTime: number, tolerance = 0.45): number {
  if (!Number.isFinite(nextTime) || nextTime < 0) return 0
  if (nextTime > maxWatchedTime + tolerance) return Math.max(0, maxWatchedTime)
  return nextTime
}

export function readGatedProgress(scope: string): GatedProgress {
  try {
    const raw = localStorage.getItem(gatedStorageKey(scope))
    if (!raw) return { maxWatchedTime: 0, completed: false }
    const parsed = JSON.parse(raw) as Partial<GatedProgress>
    return {
      maxWatchedTime: Number(parsed.maxWatchedTime) || 0,
      completed: parsed.completed === true,
    }
  } catch {
    return { maxWatchedTime: 0, completed: false }
  }
}

export function writeGatedProgress(scope: string, progress: GatedProgress): void {
  localStorage.setItem(gatedStorageKey(scope), JSON.stringify(progress))
}
