/* ──────────────────────────────
  Batch Request Manager
  Accumulates translation requests within a
  time window or batch size limit, merges them
  into a single LLM prompt, then splits responses
  back to individual requesters.
  ────────────────────────────── */

export interface BatchRequestOptions {
  /** Maximum number of texts to batch together (default: 10) */
  maxBatchSize: number
  /** Time window in ms to wait for more requests before flushing (default: 200) */
  flushIntervalMs: number
}

interface PendingItem {
  text: string
  priority: number
  resolve: (result: string) => void
  reject: (error: Error) => void
}

const BATCH_SEPARATOR = '∅∅∅'

export class BatchRequestManager {
  private pendingItems: PendingItem[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly options: BatchRequestOptions,
    private readonly executeBatch: (texts: string[]) => Promise<string[]>,
  ) {}

  enqueue(text: string, priority: number = 1): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.pendingItems.push({ text, priority, resolve, reject })

      if (this.pendingItems.length >= this.options.maxBatchSize) {
        this.flush()
      }
      else if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), this.options.flushIntervalMs)
      }
    })
  }

  private flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    if (this.pendingItems.length === 0) return

    // Sort by priority (lower number = higher priority) before batching
    this.pendingItems.sort((a, b) => a.priority - b.priority)

    const batch = this.pendingItems.splice(0, this.options.maxBatchSize)
    this.processBatch(batch)

    // If there are still pending items, schedule next flush
    if (this.pendingItems.length > 0) {
      this.flushTimer = setTimeout(() => this.flush(), this.options.flushIntervalMs)
    }
  }

  private async processBatch(batch: PendingItem[]): Promise<void> {
    // Single item: no batching overhead
    if (batch.length === 1) {
      try {
        const results = await this.executeBatch([batch[0].text])
        batch[0].resolve(results[0])
      }
      catch (error) {
        batch[0].reject(error instanceof Error ? error : new Error(String(error)))
      }
      return
    }

    try {
      const texts = batch.map(item => item.text)
      const results = await this.executeBatch(texts)

      if (results.length !== batch.length) {
        // Fallback: retry as individual requests instead of rejecting all
        await this.fallbackToIndividual(batch)
        return
      }

      for (let i = 0; i < batch.length; i++) {
        batch[i].resolve(results[i])
      }
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      for (const item of batch) {
        item.reject(err)
      }
    }
  }

  get pendingCount(): number {
    return this.pendingItems.length
  }

  private async fallbackToIndividual(batch: PendingItem[]): Promise<void> {
    const promises = batch.map(async (item) => {
      try {
        const results = await this.executeBatch([item.text])
        item.resolve(results[0])
      }
      catch (error) {
        item.reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
    await Promise.all(promises)
  }

  dispose(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    const error = new Error('BatchRequestManager disposed')
    for (const item of this.pendingItems) {
      item.reject(error)
    }
    this.pendingItems = []
  }
}

/* ──────────────────────────────
  Batch prompt builder
  Builds a numbered prompt for batch translation
  and parses the numbered response
  ────────────────────────────── */

export function buildBatchTranslatePrompt(texts: string[], targetLang: string): string {
  const numbered = texts.map((text, i) => `[${i + 1}] ${text}`).join('\n')
  return `Translate each numbered text below into ${targetLang}. Output ONLY the translations in the same numbered format. Keep the same numbering. Do not add explanations.\n\n${numbered}`
}

export function parseBatchTranslateResponse(response: string, expectedCount: number): string[] {
  const lines = response.trim().split('\n')
  const results: string[] = []

  for (const line of lines) {
    // Match numbered format: [1] translated text or 1. translated text
    const match = line.match(/^\[?\d+[\].)]\s*(.+)$/)
    if (match) {
      results.push(match[1].trim())
    }
  }

  // If we got the right count, return as-is
  if (results.length === expectedCount) {
    return results
  }

  // Fallback: try splitting by separator
  if (response.includes(BATCH_SEPARATOR)) {
    const parts = response.split(BATCH_SEPARATOR).map(s => s.trim()).filter(Boolean)
    if (parts.length === expectedCount) {
      return parts
    }
  }

  // Last resort: return whatever we parsed, padded with empty strings
  while (results.length < expectedCount) {
    results.push('')
  }
  return results.slice(0, expectedCount)
}
