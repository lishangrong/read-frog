import type { TtsEngine, TtsPlaybackState, TtsSpeakOptions, TtsVoiceInfo } from './tts-engine'

/**
 * TTS engine using the browser's built-in Web Speech API.
 * No API key required, works offline.
 */
export class WebSpeechEngine implements TtsEngine {
  private utterance: SpeechSynthesisUtterance | null = null
  private _state: TtsPlaybackState = 'idle'
  onStateChange: ((state: TtsPlaybackState) => void) | null = null

  get state(): TtsPlaybackState {
    return this._state
  }

  private setState(state: TtsPlaybackState) {
    this._state = state
    this.onStateChange?.(state)
  }

  async speak(text: string, options: TtsSpeakOptions): Promise<void> {
    this.stop()

    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.speed
      utterance.lang = options.lang

      // Try to find the requested voice
      const voices = window.speechSynthesis.getVoices()
      if (options.voice) {
        const match = voices.find(v =>
          v.name === options.voice || v.voiceURI === options.voice,
        )
        if (match)
          utterance.voice = match
      }

      utterance.onstart = () => {
        this.setState('playing')
      }
      utterance.onpause = () => {
        this.setState('paused')
      }
      utterance.onresume = () => {
        this.setState('playing')
      }
      utterance.onend = () => {
        this.setState('idle')
        this.utterance = null
        resolve()
      }
      utterance.onerror = (event) => {
        this.setState('idle')
        this.utterance = null
        if (event.error !== 'canceled') {
          reject(new Error(`Speech synthesis error: ${event.error}`))
        }
        else {
          resolve()
        }
      }

      this.utterance = utterance
      window.speechSynthesis.speak(utterance)
    })
  }

  stop() {
    window.speechSynthesis.cancel()
    this.utterance = null
    this.setState('idle')
  }

  pause() {
    if (this._state === 'playing') {
      window.speechSynthesis.pause()
      this.setState('paused')
    }
  }

  resume() {
    if (this._state === 'paused') {
      window.speechSynthesis.resume()
      this.setState('playing')
    }
  }

  async getVoices(): Promise<TtsVoiceInfo[]> {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        resolve(voices.map(v => ({
          id: v.voiceURI,
          name: v.name,
          lang: v.lang,
        })))
        return
      }
      // Voices may not be loaded yet
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        resolve(window.speechSynthesis.getVoices().map(v => ({
          id: v.voiceURI,
          name: v.name,
          lang: v.lang,
        })))
      }, { once: true })
    })
  }

  destroy() {
    this.stop()
    this.onStateChange = null
  }
}
