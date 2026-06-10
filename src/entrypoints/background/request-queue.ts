import type { Config } from '@/types/config/config'
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '@/utils/constants/config'
import { getProviderRegistryInstance } from '@/providers/registry'
import { aiTranslate, googleTranslate, microsoftTranslate } from '@/utils/host/translate/api'
import { RequestQueue } from '@/utils/request/request-queue'

export function setUpRequestQueue() {
  const requestQueue = new RequestQueue({
    rate: 5,
    capacity: 300,
    timeoutMs: 20_000,
    maxRetries: 2,
    baseRetryDelayMs: 1_000,
  })

  const registry = getProviderRegistryInstance()

  // New unified handler: uses provider registry for all providers
  onMessage('translateRequest', async (message) => {
    const { data } = message

    // Load config from storage to resolve provider context
    const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`) ?? DEFAULT_CONFIG
    const ctx = registry.resolveContext(data.providerId, config)
    const provider = registry.get(data.providerId)

    const thunk = () => provider.translate(ctx, {
      text: data.text,
      sourceLang: data.sourceLang,
      targetLang: data.targetLang,
    }).then(r => r.translatedText)

    return requestQueue.enqueue(thunk, data.scheduleAt, data.hash)
  })

  // Legacy handler: kept for backward compatibility
  onMessage('enqueueRequest', (message) => {
    const { data } = message

    // Create thunk based on type and params
    let thunk: () => Promise<any>
    switch (data.type) {
      case 'googleTranslate':
        thunk = () => googleTranslate(data.params.text, data.params.fromLang, data.params.toLang)
        break
      case 'microsoftTranslate':
        thunk = () => microsoftTranslate(data.params.text, data.params.fromLang, data.params.toLang)
        break
      case 'aiTranslate':
        thunk = () => aiTranslate(data.params.provider, data.params.modelString, data.params.prompt)
        break
      default:
        throw new Error(`Unknown request type: ${data.type}`)
    }

    return requestQueue.enqueue(thunk, data.scheduleAt, data.hash)
  })
}
