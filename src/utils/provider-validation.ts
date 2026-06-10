import type { APIProviderNames, ProvidersConfig } from '@/types/config/provider'
import { apiProviderNames } from '@/types/config/provider'

/* ──────────────────────────────
  API key format patterns
  ────────────────────────────── */

const API_KEY_PATTERNS: Partial<Record<APIProviderNames, { pattern: RegExp, hint: string }>> = {
  openai: { pattern: /^sk-[a-zA-Z0-9_-]{20,}$/, hint: 'Should start with "sk-"' },
  claude: { pattern: /^sk-ant-[a-zA-Z0-9_-]{20,}$/, hint: 'Should start with "sk-ant-"' },
  groq: { pattern: /^gsk_[a-zA-Z0-9]{20,}$/, hint: 'Should start with "gsk_"' },
  deepseek: { pattern: /^sk-[a-zA-Z0-9]{20,}$/, hint: 'Should start with "sk-"' },
  mistral: { pattern: /^[a-zA-Z0-9]{20,}$/, hint: 'Should be at least 20 alphanumeric characters' },
}

/* ──────────────────────────────
  API key format validation
  ────────────────────────────── */

export function validateAPIKeyFormat(
  provider: APIProviderNames,
  apiKey: string,
): { valid: boolean, error?: string } {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' }
  }

  const rule = API_KEY_PATTERNS[provider]
  if (!rule) {
    // No known pattern for this provider, accept any non-empty string
    return { valid: true }
  }

  if (!rule.pattern.test(apiKey.trim())) {
    return { valid: false, error: `Invalid API key format. ${rule.hint}` }
  }

  return { valid: true }
}

/* ──────────────────────────────
  Connection test
  ────────────────────────────── */

export async function testConnection(
  provider: APIProviderNames,
  config: { apiKey?: string, baseURL?: string },
): Promise<{ success: boolean, error?: string }> {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    return { success: false, error: 'API key is required' }
  }

  // Format check first
  const formatResult = validateAPIKeyFormat(provider, config.apiKey)
  if (!formatResult.valid) {
    return { success: false, error: formatResult.error }
  }

  try {
    // For Ollama, check if the server is reachable
    if (provider === 'ollama') {
      const baseURL = config.baseURL || 'http://localhost:11434/v1'
      const response = await fetch(`${baseURL}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
        ? { success: true }
        : { success: false, error: `Server returned ${response.status}` }
    }

    // For other providers, try a lightweight models list request
    const baseURL = config.baseURL || ''
    const response = await fetch(`${baseURL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      return { success: true }
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'Invalid API key (authentication failed)' }
    }

    return { success: false, error: `Server returned ${response.status}` }
  }
  catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return { success: false, error: 'Connection timed out' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown connection error' }
  }
}

/* ──────────────────────────────
  Provider config helpers
  ────────────────────────────── */

export function hasSetAPIKey(provider: APIProviderNames, providersConfig: ProvidersConfig): boolean {
  const key = providersConfig[provider]?.apiKey
  return typeof key === 'string' && key.trim().length > 0
}

export function hasValidAPIKey(provider: APIProviderNames, providersConfig: ProvidersConfig): boolean {
  const key = providersConfig[provider]?.apiKey
  if (!key || key.trim().length === 0) return false
  return validateAPIKeyFormat(provider, key).valid
}

export function isAnyAPIKeySet(providersConfig: ProvidersConfig): boolean {
  return apiProviderNames.some(provider => hasSetAPIKey(provider, providersConfig))
}
