import type { Config } from '@/types/config/config'
import type { TtsVoice } from '@/types/config/tts'
import { CONFIG_STORAGE_KEY } from '@/utils/constants/config'

/**
 * Handle TTS requests in the background script.
 * Calls OpenAI's /v1/audio/speech API and returns base64-encoded audio.
 */
export async function handleTtsRequest(params: {
  text: string
  voice: TtsVoice
  speed: number
  lang: string
}): Promise<string> {
  const config = await storage.getItem<Config>(`local:${CONFIG_STORAGE_KEY}`)
  if (!config) {
    throw new Error('No config found')
  }

  const providerConfig = config.providersConfig.openai
  if (!providerConfig.apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const baseURL = providerConfig.baseURL || 'https://api.openai.com/v1'

  const response = await fetch(`${baseURL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: params.text,
      voice: params.voice,
      speed: params.speed,
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const base64 = arrayBufferToBase64(arrayBuffer)
  return base64
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
