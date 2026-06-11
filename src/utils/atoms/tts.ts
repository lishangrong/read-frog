import { atom } from 'jotai'

import type { TTSVoice } from '@/types/config/tts'
import type { TTSProgress, TTSProviderId } from '@/utils/tts/types'
import { getVoicesForProvider, OPENAI_TTS_VOICES } from '@/utils/tts/voice-catalog'

/**
 * Predefined AI voices available for TTS.
 * Each voice has a distinct timbre and personality.
 */
export const AVAILABLE_TTS_VOICES: TTSVoice[] = OPENAI_TTS_VOICES

/** Supported playback speed presets */
export const TTS_SPEED_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0] as const

/**
 * Current TTS playback state.
 */
export type TTSPlaybackState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error'

/** Atom holding the current TTS playback state */
export const ttsPlaybackStateAtom = atom<TTSPlaybackState>('idle')

/** Atom holding the text currently being spoken */
export const ttsTextAtom = atom<string>('')

/** Atom holding the current playback speed (0.25 – 4.0) */
export const ttsSpeedAtom = atom<number>(1.0)

/** Atom holding the currently selected voice id */
export const ttsVoiceIdAtom = atom<string>('alloy')

/** Atom holding the current volume (0.0 – 1.0) */
export const ttsVolumeAtom = atom<number>(1.0)

/** Atom holding an error message when playback fails */
export const ttsErrorAtom = atom<string | null>(null)

/** Atom holding the current TTS provider */
export const ttsProviderAtom = atom<TTSProviderId>('web-speech')

/** Atom holding the current playback progress */
export const ttsProgressAtom = atom<TTSProgress>({
  currentTime: 0,
  duration: 0,
  percentage: 0,
})

/** Atom holding the cache/preload status */
export const ttsCacheStatusAtom = atom<{ isPreloading: boolean, isCached: boolean }>({
  isPreloading: false,
  isCached: false,
})

/**
 * Derived atom: returns the full TTSVoice object for the selected voice id.
 */
export const ttsSelectedVoiceAtom = atom(
  (get) => {
    const id = get(ttsVoiceIdAtom)
    return AVAILABLE_TTS_VOICES.find(v => v.id === id) ?? AVAILABLE_TTS_VOICES[0]
  },
)

/**
 * Derived atom: returns voices available for the currently selected provider.
 * For 'openai', returns the fixed OpenAI voice list.
 * For 'web-speech', returns system voices (discovered at runtime).
 */
export const ttsVoicesForProviderAtom = atom(
  (get) => {
    const provider = get(ttsProviderAtom)
    if (provider === 'openai') {
      return OPENAI_TTS_VOICES
    }
    // For web-speech, try to get system voices
    const systemVoices = typeof window !== 'undefined' && window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : []
    return getVoicesForProvider(provider, systemVoices)
  },
)

