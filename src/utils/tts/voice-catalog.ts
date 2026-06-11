import type { TTSVoice } from '@/types/config/tts'
import type { TTSProviderId } from './types'

/**
 * OpenAI TTS voices — all support any language the model handles.
 */
export const OPENAI_TTS_VOICES: TTSVoice[] = [
  { id: 'alloy', name: 'Alloy', lang: 'en', gender: 'neutral' },
  { id: 'echo', name: 'Echo', lang: 'en', gender: 'male' },
  { id: 'fable', name: 'Fable', lang: 'en', gender: 'neutral' },
  { id: 'onyx', name: 'Onyx', lang: 'en', gender: 'male' },
  { id: 'nova', name: 'Nova', lang: 'en', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer', lang: 'en', gender: 'female' },
  { id: 'sage', name: 'Sage', lang: 'en', gender: 'neutral' },
  { id: 'coral', name: 'Coral', lang: 'en', gender: 'female' },
]

/**
 * Web Speech voices — discovered dynamically from the browser.
 * This is a fallback list for environments where getVoices() returns empty.
 */
export const WEB_SPEECH_FALLBACK_VOICES: TTSVoice[] = [
  { id: 'default', name: 'System Default', lang: 'en', gender: 'neutral' },
]

/**
 * Supported languages for OpenAI TTS.
 * The tts-1 / tts-1-hd models support many languages; these are the primary ones.
 */
export const OPENAI_TTS_LANGUAGES = [
  'en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi',
  'nl', 'pl', 'sv', 'tr', 'vi', 'th', 'id', 'cs', 'da', 'fi', 'el', 'he',
  'hu', 'ms', 'no', 'ro', 'sk', 'uk',
] as const

/**
 * Get voices available for a specific TTS provider.
 *
 * @param provider - TTS provider identifier
 * @param systemVoices - Optional pre-loaded system voices (for Web Speech)
 */
export function getVoicesForProvider(
  provider: TTSProviderId,
  systemVoices?: SpeechSynthesisVoice[],
): TTSVoice[] {
  if (provider === 'openai') {
    return OPENAI_TTS_VOICES
  }

  // Web Speech: use system voices if available, otherwise fallback
  if (systemVoices && systemVoices.length > 0) {
    return systemVoices.map(voice => ({
      id: voice.voiceURI || voice.name,
      name: voice.name,
      lang: voice.lang.slice(0, 2), // Normalize to ISO 639-1
      gender: inferGenderFromName(voice.name),
    }))
  }

  return WEB_SPEECH_FALLBACK_VOICES
}

/**
 * Filter voices by language code.
 */
export function getVoicesByLanguage(
  voices: TTSVoice[],
  lang: string,
): TTSVoice[] {
  const normalizedLang = lang.slice(0, 2).toLowerCase()
  return voices.filter(v => v.lang.toLowerCase() === normalizedLang)
}

/**
 * Filter voices by gender.
 */
export function getVoicesByGender(
  voices: TTSVoice[],
  gender: 'male' | 'female' | 'neutral',
): TTSVoice[] {
  return voices.filter(v => v.gender === gender)
}

/**
 * Find the best matching voice for a given ID from a list.
 */
export function findVoiceById(
  voices: TTSVoice[],
  voiceId: string,
): TTSVoice | undefined {
  return voices.find(v => v.id === voiceId || v.id.toLowerCase() === voiceId.toLowerCase())
}

/**
 * Infer gender from voice name (heuristic for Web Speech voices).
 */
function inferGenderFromName(name: string): 'male' | 'female' | 'neutral' {
  const lowerName = name.toLowerCase()
  const femaleHints = ['female', 'woman', 'zira', 'hazel', 'susan', 'linda', 'samantha', 'victoria', 'karen', 'moira', 'fiona', 'tessa', 'mei-jia', 'ting-ting']
  const maleHints = ['male', 'man', 'david', 'mark', 'james', 'daniel', 'alex', 'fred', 'thomas', 'oliver', 'sinji', 'meijia']

  if (femaleHints.some(hint => lowerName.includes(hint))) return 'female'
  if (maleHints.some(hint => lowerName.includes(hint))) return 'male'
  return 'neutral'
}
