import type {
  IProviderContract,
  ProviderContext,
  TranslateRequest,
  TranslateResult,
} from '@/types/provider/contract'

export interface BatchCollectorOptions {
  /** Max items to collect before auto-flushing */
  maxBatchSize: number
  /** Max wait time in ms before auto-flushing */
  debounceMs: number
}

interface PendingItem {
  request: TranslateRequest
  resolve: (result: TranslateResult) => void
  reject: (error: Error) => void
}

/**
 * Collects individual translate requests and flushes them as a batch.
 *
 * Three-level strategy:
 * 1. Single item — no batching overhead, direct translate() call
 * 2. Provider with native batch API (e.g., DeepL) — uses batchTranslate()
 * 3. LLM providers — merges texts into a single prompt, parses numbered lines
 * 4. Fallback — if batch fails, falls back to parallel individual calls
 */
export class BatchCollector {
  private pending: PendingItem[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private provider: IProviderContract,
    private context: ProviderContext,
    private options: BatchCollectorOptions,
  ) {}

  /** Add a translate request to the batch. Returns a promise that resolves with the result. */
  add(request: TranslateRequest): Promise<TranslateResult> {
    return new Promise<TranslateResult>((resolve, reject) => {
      this.pending.push({ request, resolve, reject })

      if (this.pending.length >= this.options.maxBatchSize) {
        this.flush()
      }
      else if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), this.options.debounceMs)
      }
    })
  }

  /** Flush all pending items */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    const items = this.pending.splice(0)
    if (items.length === 0)
      return

    try {
      let results: TranslateResult[]

      if (items.length === 1) {
        // Level 1: Single item — no batching overhead
        const result = await this.provider.translate(this.context, items[0].request)
        results = [result]
      }
      else if (this.provider.batchTranslate) {
        // Level 2: Provider has native batch support
        const batchResult = await this.provider.batchTranslate(this.context, {
          items: items.map(i => i.request),
        })
        results = batchResult.results
      }
      else if (this.provider.capabilities.type === 'llm') {
        // Level 3: Prompt-level batching for LLM providers
        results = await this.promptLevelBatch(items.map(i => i.request))
      }
      else {
        // Fallback: parallel individual calls
        results = await Promise.all(
          items.map(item => this.provider.translate(this.context, item.request)),
        )
      }

      // Resolve all promises
      items.forEach((item, i) => item.resolve(results[i]))
    }
    catch (error) {
      // On batch failure, fall back to individual requests
      console.warn('Batch translate failed, falling back to individual:', error)
      await Promise.allSettled(
        items.map(async (item) => {
          try {
            const result = await this.provider.translate(this.context, item.request)
            item.resolve(result)
          }
          catch (err) {
            item.reject(err instanceof Error ? err : new Error(String(err)))
          }
        }),
      )
    }
  }

  /** Cancel all pending items */
  cancel(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    const items = this.pending.splice(0)
    items.forEach(item => item.reject(new Error('Batch cancelled')))
  }

  /**
   * Prompt-level batch: merge multiple texts into one LLM prompt.
   * Parses numbered lines from response.
   */
  private async promptLevelBatch(requests: TranslateRequest[]): Promise<TranslateResult[]> {
    const numberedTexts = requests.map((r, i) => `${i + 1}. ${r.text}`).join('\n')
    const targetLang = requests[0].targetLang

    const batchPrompt = `Translate each of the following numbered lines into ${targetLang}. Output one translation per line, keeping the same numbering. Output ONLY the translations.\n\n${numberedTexts}`

    const result = await this.provider.translate(this.context, {
      text: batchPrompt,
      sourceLang: requests[0].sourceLang,
      targetLang,
    })

    // Parse numbered lines from response
    const lines = result.translatedText
      .split('\n')
      .map(line => line.replace(/^\d+[\.\)\s]+/, '').trim())
      .filter(Boolean)

    // If parsing fails (wrong number of lines), fall back
    if (lines.length !== requests.length) {
      throw new Error(`Batch parse failed: expected ${requests.length} lines, got ${lines.length}`)
    }

    return lines.map(text => ({ translatedText: text }))
  }
}
