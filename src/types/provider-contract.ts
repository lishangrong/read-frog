import type { AllProviderNames } from './config/provider'
import type { ProvidersConfig } from './config/provider'
import type { ServiceType } from './config/service'

/* ──────────────────────────────
  IProviderContract - unified interface
  for all provider types
  ────────────────────────────── */

export interface IProviderContract {
  readonly name: AllProviderNames
  readonly supportedServices: readonly ServiceType[]
  readonly requiresAPIKey: boolean

  /** Translate text from one language to another */
  translate(text: string, fromLang: string, toLang: string): Promise<string>

  /** Check if the provider is properly configured (has API key if needed) */
  isConfigured(providersConfig: ProvidersConfig): boolean
}
