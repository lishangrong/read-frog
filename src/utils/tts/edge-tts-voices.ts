/**
 * Edge TTS voice definitions.
 * Curated list of popular voices across major languages.
 */

export interface EdgeTtsVoiceInfo {
  id: string
  label: string
  lang: string
  gender: 'male' | 'female'
}

export const EDGE_TTS_VOICES: EdgeTtsVoiceInfo[] = [
  // English (US)
  { id: 'en-US-AriaNeural', label: 'Aria', lang: 'en-US', gender: 'female' },
  { id: 'en-US-GuyNeural', label: 'Guy', lang: 'en-US', gender: 'male' },
  { id: 'en-US-JennyNeural', label: 'Jenny', lang: 'en-US', gender: 'female' },
  { id: 'en-US-ChristopherNeural', label: 'Christopher', lang: 'en-US', gender: 'male' },
  // English (UK)
  { id: 'en-GB-SoniaNeural', label: 'Sonia', lang: 'en-GB', gender: 'female' },
  { id: 'en-GB-RyanNeural', label: 'Ryan', lang: 'en-GB', gender: 'male' },
  // Chinese (Simplified)
  { id: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao', lang: 'zh-CN', gender: 'female' },
  { id: 'zh-CN-YunxiNeural', label: 'Yunxi', lang: 'zh-CN', gender: 'male' },
  { id: 'zh-CN-XiaoyiNeural', label: 'Xiaoyi', lang: 'zh-CN', gender: 'female' },
  { id: 'zh-CN-YunjianNeural', label: 'Yunjian', lang: 'zh-CN', gender: 'male' },
  // Chinese (Traditional)
  { id: 'zh-TW-HsiaoChenNeural', label: 'HsiaoChen', lang: 'zh-TW', gender: 'female' },
  { id: 'zh-TW-YunJheNeural', label: 'YunJhe', lang: 'zh-TW', gender: 'male' },
  // Japanese
  { id: 'ja-JP-NanamiNeural', label: 'Nanami', lang: 'ja-JP', gender: 'female' },
  { id: 'ja-JP-KeitaNeural', label: 'Keita', lang: 'ja-JP', gender: 'male' },
  // Korean
  { id: 'ko-KR-SunHiNeural', label: 'SunHi', lang: 'ko-KR', gender: 'female' },
  { id: 'ko-KR-InJoonNeural', label: 'InJoon', lang: 'ko-KR', gender: 'male' },
  // French
  { id: 'fr-FR-DeniseNeural', label: 'Denise', lang: 'fr-FR', gender: 'female' },
  { id: 'fr-FR-HenriNeural', label: 'Henri', lang: 'fr-FR', gender: 'male' },
  // German
  { id: 'de-DE-KatjaNeural', label: 'Katja', lang: 'de-DE', gender: 'female' },
  { id: 'de-DE-ConradNeural', label: 'Conrad', lang: 'de-DE', gender: 'male' },
  // Spanish
  { id: 'es-ES-ElviraNeural', label: 'Elvira', lang: 'es-ES', gender: 'female' },
  { id: 'es-ES-AlvaroNeural', label: 'Alvaro', lang: 'es-ES', gender: 'male' },
  // Portuguese
  { id: 'pt-BR-FranciscaNeural', label: 'Francisca', lang: 'pt-BR', gender: 'female' },
  { id: 'pt-BR-AntonioNeural', label: 'Antonio', lang: 'pt-BR', gender: 'male' },
  // Russian
  { id: 'ru-RU-SvetlanaNeural', label: 'Svetlana', lang: 'ru-RU', gender: 'female' },
  { id: 'ru-RU-DmitryNeural', label: 'Dmitry', lang: 'ru-RU', gender: 'male' },
  // Italian
  { id: 'it-IT-ElsaNeural', label: 'Elsa', lang: 'it-IT', gender: 'female' },
  { id: 'it-IT-DiegoNeural', label: 'Diego', lang: 'it-IT', gender: 'male' },
  // Arabic
  { id: 'ar-SA-ZariyahNeural', label: 'Zariyah', lang: 'ar-SA', gender: 'female' },
  { id: 'ar-SA-HamedNeural', label: 'Hamed', lang: 'ar-SA', gender: 'male' },
  // Hindi
  { id: 'hi-IN-SwaraNeural', label: 'Swara', lang: 'hi-IN', gender: 'female' },
  { id: 'hi-IN-MadhurNeural', label: 'Madhur', lang: 'hi-IN', gender: 'male' },
  // Thai
  { id: 'th-TH-PremwadeeNeural', label: 'Premwadee', lang: 'th-TH', gender: 'female' },
  { id: 'th-TH-NiwatNeural', label: 'Niwat', lang: 'th-TH', gender: 'male' },
  // Vietnamese
  { id: 'vi-VN-HoaiMyNeural', label: 'HoaiMy', lang: 'vi-VN', gender: 'female' },
  { id: 'vi-VN-NamMinhNeural', label: 'NamMinh', lang: 'vi-VN', gender: 'male' },
]

/**
 * Get Edge TTS voices grouped by language.
 */
export function getEdgeTtsVoicesByLang(): Record<string, EdgeTtsVoiceInfo[]> {
  const groups: Record<string, EdgeTtsVoiceInfo[]> = {}
  for (const voice of EDGE_TTS_VOICES) {
    if (!groups[voice.lang]) {
      groups[voice.lang] = []
    }
    groups[voice.lang].push(voice)
  }
  return groups
}

/**
 * Get the default Edge TTS voice for a given language, or fallback to en-US.
 */
export function getDefaultEdgeTtsVoice(lang?: string): string {
  if (lang) {
    const match = EDGE_TTS_VOICES.find(v => v.lang === lang)
    if (match) return match.id
    // Try matching by language prefix (e.g., 'en' matches 'en-US')
    const prefix = lang.split('-')[0]
    const prefixMatch = EDGE_TTS_VOICES.find(v => v.lang.startsWith(prefix))
    if (prefixMatch) return prefixMatch.id
  }
  return 'en-US-AriaNeural'
}
