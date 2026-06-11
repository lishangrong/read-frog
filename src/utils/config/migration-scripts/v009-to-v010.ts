/**
 * Migration v9 → v10: Extend TTS config with provider, model, format, and preload settings.
 * Preserves all existing user configuration and adds sensible defaults for new fields.
 */
export function migrate(oldConfig: any): any {
  const existingTts = oldConfig.tts ?? {}

  return {
    ...oldConfig,
    tts: {
      enabled: existingTts.enabled ?? true,
      speed: existingTts.speed ?? 1.0,
      voiceId: existingTts.voiceId ?? 'alloy',
      volume: existingTts.volume ?? 1.0,
      // New fields with defaults
      provider: existingTts.provider ?? 'web-speech',
      model: existingTts.model ?? 'tts-1',
      format: existingTts.format ?? 'mp3',
      preloadOnTranslate: existingTts.preloadOnTranslate ?? true,
    },
  }
}
