import deepmerge from 'deepmerge'

export function migrate(oldConfig: any): any {
  return deepmerge(oldConfig, {
    tts: {
      enabled: false,
      provider: 'webSpeech',
      voice: 'alloy',
      speed: 1,
      autoPlay: false,
    },
    subtitle: {
      enabled: false,
      displayMode: 'bilingual',
      position: 'below',
      fontSize: 16,
      opacity: 0.85,
      autoDetect: true,
    },
  })
}
