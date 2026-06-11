import type { Config } from '@/types/config/config'
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '@/utils/constants/config'

/**
 * Background handler for TTS synthesis requests.
 *
 * Calls the OpenAI TTS API (`/v1/audio/speech`) in the background context
 * where CORS restrictions don't apply and API keys are safe.
 * Returns base64-encoded audio data to the content script.
 */
export function setUpTTSHandler(): void {
  onMessage('ttsSynthesize', async (message) => {
    const { text, voiceId, speed, model, format } = message.data

    // Load config from storage to get OpenAI API key and base URL
    const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`) ?? DEFAULT_CONFIG
    const openaiConfig = config.providersConfig?.openai

    if (!openaiConfig?.apiKey) {
      throw new Error('OpenAI API key is not configured. Please add it in the extension settings.')
    }

    const baseURL = openaiConfig.baseURL || 'https://api.openai.com/v1'

    // Call OpenAI TTS API
    const response = await fetch(`${baseURL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice: voiceId,
        speed,
        response_format: format,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`OpenAI TTS API error (${response.status}): ${errorBody}`)
    }

    // Convert audio blob to base64 for transport via messaging
    const audioBlob = await response.blob()
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)

    return { audio: base64 }
  })
}

/**
 * Convert an ArrayBuffer to a base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
