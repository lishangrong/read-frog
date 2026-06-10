/**
 * Migration v8 → v9: Add TTS and subtitle translation config.
 * Adds `tts` and `subtitle` top-level config keys with sensible defaults.
 * Preserves all existing user configuration.
 */
export function migrate(oldConfig: any): any {
  return {
    ...oldConfig,
    tts: {
      enabled: true,
      speed: 1.0,
      voiceId: 'alloy',
      volume: 1.0,
    },
    subtitle: {
      enabled: true,
      autoTranslate: true,
    },
  }
}
