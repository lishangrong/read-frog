/**
 * Features a provider may support.
 * Used for UI filtering and runtime capability checks.
 */
export type ProviderFeature =
  | 'translate'
  | 'analyze'
  | 'explain'
  | 'streaming'
  | 'structuredOutput'
  | 'vision'
  | 'batchTranslate'
  | 'freeTier'
  | 'localOnly'

/**
 * Static capabilities declared per provider.
 */
export interface ModelCapabilities {
  /** Which features this provider supports */
  features: readonly ProviderFeature[]

  /** Whether this is an LLM provider (has LanguageModel) or pure HTTP translate */
  type: 'llm' | 'http-translate'

  /** Whether API key is required (false for Google Translate, Microsoft Translate) */
  requiresApiKey: boolean

  /** Whether baseURL is configurable (true for most, false for hosted-only APIs) */
  configurableBaseURL: boolean

  /** Maximum recommended batch size for batch translation (1 = no batching) */
  maxBatchSize: number

  /** Whether the provider supports the read feature (analyze + explain) */
  supportsRead: boolean

  /** Default models offered by this provider */
  defaultModels: readonly string[]
}

/**
 * Helper to check if a feature is supported.
 */
export function hasFeature(
  caps: ModelCapabilities,
  feature: ProviderFeature,
): boolean {
  return caps.features.includes(feature)
}
