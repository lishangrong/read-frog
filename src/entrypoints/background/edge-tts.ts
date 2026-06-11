/**
 * Handle Edge TTS requests in the background script.
 * Uses Microsoft Edge's speech synthesis WebSocket endpoint
 * to synthesize speech and return audio as base64.
 */

const EDGE_TTS_WS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
const EDGE_TTS_TRUST_TOKEN_URL = 'https://edge.microsoft.com/translate/auth'

let cachedToken: string | null = null
let tokenExpiry = 0

/**
 * Fetch an auth token for the Edge TTS WebSocket.
 */
async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const response = await fetch(EDGE_TTS_TRUST_TOKEN_URL)
  if (!response.ok) {
    throw new Error(`Failed to get Edge TTS auth token: ${response.status}`)
  }

  cachedToken = await response.text()
  // Token is valid for ~10 minutes; refresh at 8 minutes
  tokenExpiry = Date.now() + 8 * 60 * 1000
  return cachedToken
}

/**
 * Generate a unique request ID for the WebSocket session.
 */
function generateRequestId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

/**
 * Build SSML for Edge TTS synthesis.
 */
function buildSSML(text: string, voice: string, speed: number): string {
  // Speed is expressed as a percentage offset: 1.0 = +0%, 1.5 = +50%, 0.5 = -50%
  const ratePercent = Math.round((speed - 1) * 100)
  const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`

  // Escape XML special characters in text
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">`
    + `<voice name="${voice}">`
    + `<prosody rate="${rateStr}">${escapedText}</prosody>`
    + `</voice>`
    + `</speak>`
}

/**
 * Handle an Edge TTS request by connecting to the WebSocket endpoint
 * and collecting audio chunks.
 */
export async function handleEdgeTtsRequest(params: {
  text: string
  voice: string
  speed: number
  lang: string
}): Promise<string> {
  const token = await getAuthToken()
  const requestId = generateRequestId()
  const ssml = buildSSML(params.text, params.voice, params.speed)

  return new Promise<string>((resolve, reject) => {
    const wsUrl = `${EDGE_TTS_WS_URL}?TrustedClientToken=${token}&ConnectionId=${requestId}`
    const ws = new WebSocket(wsUrl)

    const audioChunks: ArrayBuffer[] = []
    let resolved = false

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        ws.close()
        reject(new Error('Edge TTS request timed out'))
      }
    }, 30000)

    ws.onopen = () => {
      // Send speech config
      ws.send(
        `Content-Type:application/json; charset=utf-8\r\n`
        + `Path:speech.config\r\n\r\n`
        + JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        }),
      )

      // Send SSML synthesis request
      ws.send(
        `X-RequestId:${requestId}\r\n`
        + `Content-Type:application/ssml+xml\r\n`
        + `Path:ssml\r\n\r\n`
        + ssml,
      )
    }

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Text messages: check for turn.end which signals completion
        if (event.data.includes('Path:turn.end')) {
          resolved = true
          clearTimeout(timeout)
          ws.close()

          // Concatenate audio chunks and convert to base64
          const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
          const combined = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of audioChunks) {
            combined.set(new Uint8Array(chunk), offset)
            offset += chunk.byteLength
          }

          resolve(arrayBufferToBase64(combined.buffer))
        }
      }
      else if (event.data instanceof Blob) {
        // Binary messages contain the audio data with a header
        event.data.arrayBuffer().then((buffer) => {
          // The binary message has a 2-byte header length prefix
          const view = new DataView(buffer)
          const headerLength = view.getUint16(0)
          // Audio data starts after the 2-byte length + header
          const audioData = buffer.slice(2 + headerLength)
          if (audioData.byteLength > 0) {
            audioChunks.push(audioData)
          }
        })
      }
    }

    ws.onerror = (event) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        reject(new Error('Edge TTS WebSocket error'))
      }
    }

    ws.onclose = () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        if (audioChunks.length > 0) {
          const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
          const combined = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of audioChunks) {
            combined.set(new Uint8Array(chunk), offset)
            offset += chunk.byteLength
          }
          resolve(arrayBufferToBase64(combined.buffer))
        }
        else {
          reject(new Error('Edge TTS connection closed without audio data'))
        }
      }
    }
  })
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
