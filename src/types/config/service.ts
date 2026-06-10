import type { AllProviderNames } from './provider'
import { allProviderNames } from './provider'

/* ──────────────────────────────
  Service type definitions
  ────────────────────────────── */

export const serviceTypes = ['read', 'translate', 'tts', 'ocr'] as const
export type ServiceType = typeof serviceTypes[number]

/* ──────────────────────────────
  Provider-to-service mapping
  ────────────────────────────── */

export const PROVIDER_SERVICE_MAP: Record<AllProviderNames, readonly ServiceType[]> = {
  // Pure translation providers
  google: ['translate'],
  microsoft: ['translate'],
  // LLM providers (support both read and translate)
  openai: ['read', 'translate', 'tts'],
  deepseek: ['read', 'translate'],
  openrouter: ['translate'],
  ollama: ['read', 'translate'],
  gemini: ['read', 'translate'],
  claude: ['read', 'translate'],
  groq: ['read', 'translate'],
  mistral: ['read', 'translate'],
  xai: ['read', 'translate'],
  moonshot: ['read', 'translate'],
  zhipu: ['read', 'translate'],
  baichuan: ['read', 'translate'],
  minimax: ['read', 'translate'],
  stepfun: ['read', 'translate'],
  lingyi: ['read', 'translate'],
  qwen: ['read', 'translate'],
  doubao: ['read', 'translate'],
  hunyuan: ['read', 'translate'],
}

/* ──────────────────────────────
  Service type query
  ────────────────────────────── */

export function getProvidersByService(serviceType: ServiceType): AllProviderNames[] {
  return allProviderNames.filter(name => PROVIDER_SERVICE_MAP[name].includes(serviceType))
}

export function supportsService(provider: AllProviderNames, serviceType: ServiceType): boolean {
  return PROVIDER_SERVICE_MAP[provider].includes(serviceType)
}
