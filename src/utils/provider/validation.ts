import type { ProviderContext } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '@/providers/capabilities-map'
import type { ProviderId } from '@/providers/capabilities-map'
import { getProviderRegistryInstance } from '@/providers/registry'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Validate a provider's configuration without making network calls.
 * Checks: API key requirement, URL format, provider-specific rules.
 */
export function validateProviderConfig(providerId: string, config: {
  apiKey?: string
  baseURL?: string
}): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const caps = PROVIDER_CAPABILITIES[providerId as ProviderId]

  if (!caps) {
    errors.push({ field: 'provider', message: `Unknown provider: ${providerId}`, severity: 'error' })
    return { valid: false, errors, warnings }
  }

  // Check API key requirement
  if (caps.requiresApiKey && !config.apiKey) {
    errors.push({
      field: 'apiKey',
      message: `${providerId} requires an API key`,
      severity: 'error',
    })
  }

  // Validate baseURL format if provided
  if (config.baseURL) {
    try {
      new URL(config.baseURL)
    }
    catch {
      errors.push({
        field: 'baseURL',
        message: 'Invalid URL format',
        severity: 'error',
      })
    }
  }

  // Provider-specific validations
  if (providerId === 'ollama' && config.baseURL) {
    const isLocalhost = config.baseURL.startsWith('http://localhost')
      || config.baseURL.startsWith('http://127.0.0.1')
    if (!isLocalhost) {
      warnings.push('Ollama typically runs on localhost. Make sure the URL is correct.')
    }
  }

  if (providerId === 'deepl' && config.apiKey && !config.apiKey.includes(':')) {
    warnings.push('DeepL free API keys end with ":fx". Pro keys do not require this suffix.')
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings,
  }
}

/**
 * Test connectivity to a provider by making a minimal API call.
 * For LLM providers: sends a tiny prompt ("hi") and checks response.
 * For HTTP translate providers: translates a single word.
 */
export async function testProviderConnectivity(
  providerId: string,
  context: ProviderContext,
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  try {
    const registry = getProviderRegistryInstance()
    const provider = registry.get(providerId)

    const startTime = Date.now()

    // Attempt a minimal translation
    await provider.translate(
      {
        ...context,
        model: context.model || provider.capabilities.defaultModels[0] || 'default',
        isCustomModel: false,
      },
      { text: 'hi', sourceLang: 'en', targetLang: 'zh' },
    )

    const latency = Date.now() - startTime
    if (latency > 5000) {
      warnings.push(`High latency: ${latency}ms`)
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('401') || message.includes('Unauthorized') || message.includes('API key')) {
      errors.push({ field: 'apiKey', message: 'Invalid API key', severity: 'error' })
    }
    else if (message.includes('403')) {
      errors.push({ field: 'apiKey', message: 'API key lacks required permissions', severity: 'error' })
    }
    else if (message.includes('404') || message.includes('Not Found')) {
      errors.push({ field: 'baseURL', message: 'Endpoint not found — check baseURL', severity: 'error' })
    }
    else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      errors.push({ field: 'baseURL', message: 'Connection timed out', severity: 'error' })
    }
    else {
      errors.push({ field: 'general', message: `Connection failed: ${message}`, severity: 'error' })
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings,
  }
}
