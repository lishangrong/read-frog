import type { LanguageModel } from 'ai'

import type { ModelCapabilities } from './capabilities'

/**
 * Unified context passed to all provider operations.
 * Contains everything needed to execute a request.
 * Config resolution happens in the registry, not in the provider.
 */
export interface ProviderContext {
  apiKey?: string
  baseURL?: string
  model: string
  isCustomModel: boolean
  customModel?: string
}

/**
 * Translation request — unified across all provider types.
 */
export interface TranslateRequest {
  text: string
  /** ISO 639-1 code or 'auto' */
  sourceLang: string
  /** ISO 639-1 code */
  targetLang: string
}

/**
 * Translation result.
 */
export interface TranslateResult {
  translatedText: string
  detectedSourceLang?: string
}

/**
 * Batch translation request — preserves order of input items.
 */
export interface BatchTranslateRequest {
  items: TranslateRequest[]
}

/**
 * Batch translation result — preserves order of input items.
 */
export interface BatchTranslateResult {
  results: TranslateResult[]
}

/**
 * The core provider contract.
 * Every provider MUST implement translate().
 * LLM providers additionally implement getLanguageModel() for read operations.
 * Providers with native batch API support can override batchTranslate().
 */
export interface IProviderContract {
  /** Unique provider identifier, matches config key */
  readonly id: string

  /** Declared capabilities for this provider */
  readonly capabilities: ModelCapabilities

  /**
   * Translate text. Works for both LLM and pure-translate providers.
   * For LLM providers: internally constructs prompt and calls generateText().
   * For HTTP providers: calls the translation API directly.
   */
  translate(ctx: ProviderContext, req: TranslateRequest): Promise<TranslateResult>

  /**
   * Batch translate. Default implementation calls translate() in parallel.
   * Providers can override with native batch API (e.g., DeepL).
   */
  batchTranslate?(ctx: ProviderContext, req: BatchTranslateRequest): Promise<BatchTranslateResult>

  /**
   * Get Vercel AI SDK LanguageModel for read operations (analyze/explain).
   * Only LLM providers implement this.
   * Returns null for pure-translate providers.
   */
  getLanguageModel?(ctx: ProviderContext): LanguageModel | null
}
