import { useAtom } from 'jotai'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { TtsProvider, TtsVoice } from '@/types/config/tts'
import { ttsVoices } from '@/types/config/tts'
import { configFields } from '@/utils/atoms/config'
import { TTS_PROVIDER_ITEMS, TTS_SPEED_MAX, TTS_SPEED_MIN, TTS_SPEED_STEP, TTS_VOICE_ITEMS } from '@/utils/constants/config'
import { ConfigCard } from '../../components/config-card'
import { FieldWithLabel } from '../../components/field-with-label'

export function TtsConfig() {
  const [ttsConfig, setTtsConfig] = useAtom(configFields.tts)

  return (
    <ConfigCard title="Text-to-Speech" description="Configure text-to-speech settings for reading text aloud.">
      <div className="flex flex-col gap-4">
        {/* Enable TTS */}
        <FieldWithLabel id="ttsEnabled" label="Enable TTS">
          <Switch
            checked={ttsConfig.enabled}
            onCheckedChange={checked => setTtsConfig({ ...ttsConfig, enabled: checked })}
          />
        </FieldWithLabel>

        {/* TTS Provider */}
        <FieldWithLabel id="ttsProvider" label="Provider">
          <Select
            value={ttsConfig.provider}
            onValueChange={(value: TtsProvider) => setTtsConfig({ ...ttsConfig, provider: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(TTS_PROVIDER_ITEMS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldWithLabel>

        {/* Voice (OpenAI only) */}
        {ttsConfig.provider === 'openai' && (
          <FieldWithLabel id="ttsVoice" label="Voice">
            <Select
              value={ttsConfig.voice}
              onValueChange={(value: TtsVoice) => setTtsConfig({ ...ttsConfig, voice: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ttsVoices.map(voice => (
                    <SelectItem key={voice} value={voice}>
                      {TTS_VOICE_ITEMS[voice].label}
                      {' '}
                      -
                      {' '}
                      {TTS_VOICE_ITEMS[voice].description}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FieldWithLabel>
        )}

        {/* Speed */}
        <FieldWithLabel id="ttsSpeed" label={`Speed: ${ttsConfig.speed}x`}>
          <input
            type="range"
            min={TTS_SPEED_MIN}
            max={TTS_SPEED_MAX}
            step={TTS_SPEED_STEP}
            value={ttsConfig.speed}
            onChange={e => setTtsConfig({ ...ttsConfig, speed: Number.parseFloat(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
        </FieldWithLabel>

        {/* Auto Play */}
        <FieldWithLabel id="ttsAutoPlay" label="Auto Play">
          <Switch
            checked={ttsConfig.autoPlay}
            onCheckedChange={checked => setTtsConfig({ ...ttsConfig, autoPlay: checked })}
          />
        </FieldWithLabel>
      </div>
    </ConfigCard>
  )
}
