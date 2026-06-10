/* ──────────────────────────────
  Batch Validator
  Validates and groups texts for semantic-aware
  batch translation. Ensures batched texts share
  the same script family and respects size limits.
  ────────────────────────────── */

type ScriptFamily = 'cjk' | 'cyrillic' | 'latin' | 'other'

const CJK_REGEX = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/
const CYRILLIC_REGEX = /[\u0400-\u04FF]/

/** Max total characters across all texts in a single batch */
const MAX_BATCH_CHARS = 4000

function detectScriptFamily(text: string): ScriptFamily {
  // Sample first 100 chars for performance
  const sample = text.slice(0, 100)
  const cjkCount = (sample.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g) || []).length
  const cyrillicCount = (sample.match(/[\u0400-\u04FF]/g) || []).length
  const latinCount = (sample.match(/[a-zA-Z]/g) || []).length

  const total = cjkCount + cyrillicCount + latinCount
  if (total === 0) return 'other'

  if (cjkCount / total > 0.3) return 'cjk'
  if (cyrillicCount / total > 0.3) return 'cyrillic'
  if (latinCount / total > 0.3) return 'latin'
  return 'other'
}

/**
 * Check if texts can reasonably be batched together.
 * They must share the same script family and fit within char limits.
 */
export function canBatchTogether(texts: string[]): boolean {
  if (texts.length <= 1) return true

  const totalChars = texts.reduce((sum, t) => sum + t.length, 0)
  if (totalChars > MAX_BATCH_CHARS) return false

  const families = new Set(texts.map(detectScriptFamily))
  // Allow 'other' to mix with any single family
  families.delete('other')
  return families.size <= 1
}

/**
 * Split texts into semantically coherent batches.
 * Groups by script family and respects size limits.
 */
export function splitIntoBatches(texts: string[], maxBatchSize: number): string[][] {
  if (texts.length === 0) return []

  // Group by script family
  const groups = new Map<ScriptFamily, string[]>()
  for (const text of texts) {
    const family = detectScriptFamily(text)
    const group = groups.get(family) || []
    group.push(text)
    groups.set(family, group)
  }

  // Merge 'other' into the largest group
  const otherGroup = groups.get('other')
  if (otherGroup && groups.size > 1) {
    groups.delete('other')
    let largestKey: ScriptFamily = 'latin'
    let largestSize = 0
    for (const [key, group] of groups) {
      if (group.length > largestSize) {
        largestSize = group.length
        largestKey = key
      }
    }
    const target = groups.get(largestKey)!
    target.push(...otherGroup)
  }

  // Split each group into size-limited batches
  const batches: string[][] = []
  for (const group of groups.values()) {
    let currentBatch: string[] = []
    let currentChars = 0

    for (const text of group) {
      if (
        currentBatch.length >= maxBatchSize
        || (currentChars + text.length > MAX_BATCH_CHARS && currentBatch.length > 0)
      ) {
        batches.push(currentBatch)
        currentBatch = []
        currentChars = 0
      }
      currentBatch.push(text)
      currentChars += text.length
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch)
    }
  }

  return batches
}
