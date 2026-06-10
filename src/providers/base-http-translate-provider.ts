import type { ModelCapabilities } from '@/types/provider/capabilities'
import type {
  BatchTranslateRequest,
  BatchTranslateResult,
  IProviderContract,
  ProviderContext,
  TranslateRequest,
  TranslateResult,
} from '@/types/provider/contract'

/**
 * Abstract base for pure HTTP translation providers (Google, Microsoft, DeepL, etc.).
 * Subclasses MUST implement translate() with their specific HTTP API.
 *
 * Default batchTranslate() falls back to parallel individual calls.
 * Providers with native batch API (e.g., DeepL) should override it.
 */
export abstract class BaseHttpTranslateProvider implements IProviderContract {
  abstract readonly id: string
  abstract readonly capabilities: ModelCapabilities

  /** Subclass MUST implement this */
  abstract translate(ctx: ProviderContext, req: TranslateRequest): Promise<TranslateResult>

  /** Default batch: parallel individual calls */
  async batchTranslate(ctx: ProviderContext, req: BatchTranslateRequest): Promise<BatchTranslateResult> {
    const results = await Promise.all(
      req.items.map(item => this.translate(ctx, item)),
    )
    return { results }
  }

  /** HTTP providers don't have language models */
  getLanguageModel(): null {
    return null
  }
}
