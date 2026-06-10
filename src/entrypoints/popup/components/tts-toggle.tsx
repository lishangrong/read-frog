import { useAtom } from 'jotai'

import { Switch } from '@/components/ui/switch'
import { configFields } from '@/utils/atoms/config'

export default function TtsToggle() {
  const [ttsConfig, setTtsConfig] = useAtom(configFields.tts)

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-medium">
        Text-to-Speech
      </span>
      <Switch
        checked={ttsConfig.enabled}
        onCheckedChange={(checked) => {
          setTtsConfig({ ...ttsConfig, enabled: checked })
        }}
      />
    </div>
  )
}
