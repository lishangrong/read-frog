import { atom } from 'jotai'

import type { TTSVoice } from '@/types/config/tts'

/**
 * Predefined AI voices available for TTS.
 * Each voice has a distinct timbre and personality.
 */
export const AVAILABLE_TTS_VOICES: TTSVoice[] = [
  { id: 'alloy', name: 'Alloy', lang: 'en', gender: 'neutral' },
  { id: 'echo', name: 'Echo', lang: 'en', gender: 'male' },
  { id: 'fable', name: 'Fable', lang: 'en', gender: 'neutral' },
  { id: 'onyx', name: 'Onyx', lang: 'en', gender: 'male' },
  { id: 'nova', name: 'Nova', lang: 'en', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer', lang: 'en', gender: 'female' },
  { id: 'sage', name: 'Sage', lang: 'en', gender: 'neutral' },
  { id: 'coral', name: 'Coral', lang: 'en', gender: 'female' },
]

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

/**
 * Derived atom: returns the full TTSVoice object for the selected voice id.
 */
export const ttsSelectedVoiceAtom = atom(
  (get) => {
    const id = get(ttsVoiceIdAtom)
    return AVAILABLE_TTS_VOICES.find(v => v.id === id) ?? AVAILABLE_TTS_VOICES[0]
  },
)
