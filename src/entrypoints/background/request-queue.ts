import { aiTranslate, googleTranslate, microsoftTranslate } from '@/utils/host/translate/api'
import { BatchRequestManager, buildBatchTranslatePrompt, parseBatchTranslateResponse } from '@/utils/request/batch-request-manager'
import { RequestQueue } from '@/utils/request/request-queue'

const batchManagers = new Map<string, BatchRequestManager>()

function getBatchManager(provider: string, modelString: string, targetLang: string): BatchRequestManager {
  const key = `${provider}:${modelString}:${targetLang}`
  let manager = batchManagers.get(key)
  if (!manager) {
    manager = new BatchRequestManager(
      { maxBatchSize: 10, flushIntervalMs: 200 },
      async (texts: string[]) => {
        const prompt = buildBatchTranslatePrompt(texts, targetLang)
        const response = await aiTranslate(provider as any, modelString, prompt)
        return parseBatchTranslateResponse(response, texts.length)
      },
    )
    batchManagers.set(key, manager)
  }
  return manager
}

export function setUpRequestQueue() {
  const requestQueue = new RequestQueue({
    rate: 5,
    capacity: 300,
    timeoutMs: 20_000,
    maxRetries: 2,
    baseRetryDelayMs: 1_000,
  })

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
      case 'selectionTranslate':
        thunk = () => aiTranslate(data.params.provider, data.params.modelString, data.params.prompt)
        break
      case 'batchAiTranslate': {
        const manager = getBatchManager(data.params.provider, data.params.modelString, data.params.targetLang)
        return manager.enqueue(data.params.text)
      }
      default:
        throw new Error(`Unknown request type: ${data.type}`)
    }

    return requestQueue.enqueue(thunk, data.scheduleAt, data.hash, data.priority)
  })
}
