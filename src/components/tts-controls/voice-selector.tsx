import { useAtom, useAtomValue } from 'jotai'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { configFields } from '@/utils/atoms/config'
import { TTS_PROVIDER_ITEMS, TTS_VOICE_ITEMS } from '@/utils/constants/config'
import type { TtsProvider, TtsVoice } from '@/types/config/tts'
import { ttsVoices } from '@/types/config/tts'

export function VoiceSelector() {
  const [ttsConfig, setTtsConfig] = useAtom(configFields.tts)

  return (
    <div className="flex flex-col gap-2">
      {/* Provider selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Provider</label>
        <Select
          value={ttsConfig.provider}
          onValueChange={(value: TtsProvider) => {
            setTtsConfig({ ...ttsConfig, provider: value })
          }}
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

      {/* Voice selector (only for OpenAI) */}
      {ttsConfig.provider === 'openai' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Voice</label>
          <Select
            value={ttsConfig.voice}
            onValueChange={(value: TtsVoice) => {
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
    </div>
  )
}
