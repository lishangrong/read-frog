import { useAtom, useAtomValue } from 'jotai'

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { configFields } from '@/utils/atoms/config'
import { TTS_PROVIDER_ITEMS, TTS_VOICE_ITEMS } from '@/utils/constants/config'
import type { TtsProvider } from '@/types/config/tts'
import { ttsVoices } from '@/types/config/tts'
import { EDGE_TTS_VOICES, getDefaultEdgeTtsVoice, getEdgeTtsVoicesByLang } from '@/utils/tts/edge-tts-voices'

export function VoiceSelector() {
  const [ttsConfig, setTtsConfig] = useAtom(configFields.tts)
  const language = useAtomValue(configFields.language)

  const handleProviderChange = (value: TtsProvider) => {
    // Set a sensible default voice when switching providers
    let defaultVoice = ttsConfig.voice
    if (value === 'openai') {
      defaultVoice = 'alloy'
    }
    else if (value === 'edgeTts') {
      defaultVoice = getDefaultEdgeTtsVoice(language.targetCode)
    }
    setTtsConfig({ ...ttsConfig, provider: value, voice: defaultVoice })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Provider selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Provider</label>
        <Select
          value={ttsConfig.provider}
          onValueChange={handleProviderChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(TTS_PROVIDER_ITEMS).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Voice selector (OpenAI) */}
      {ttsConfig.provider === 'openai' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Voice</label>
          <Select
            value={ttsConfig.voice}
            onValueChange={(value: string) => {
              setTtsConfig({ ...ttsConfig, voice: value })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ttsVoices.map(voice => (
                  <SelectItem key={voice} value={voice}>
                    <div className="flex flex-col">
                      <span>{TTS_VOICE_ITEMS[voice].label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {TTS_VOICE_ITEMS[voice].description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Voice selector (Edge TTS - grouped by language) */}
      {ttsConfig.provider === 'edgeTts' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Voice</label>
          <Select
            value={ttsConfig.voice}
            onValueChange={(value: string) => {
              setTtsConfig({ ...ttsConfig, voice: value })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(getEdgeTtsVoicesByLang()).map(([lang, voices]) => (
                <SelectGroup key={lang}>
                  <SelectLabel className="text-xs">{lang}</SelectLabel>
                  {voices.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <span>{voice.label}</span>
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        ({voice.gender})
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
