import { useAtom } from 'jotai'

import { Switch } from '@/components/ui/switch'
import { configFields } from '@/utils/atoms/config'

export default function SubtitleToggle() {
  const [subtitleConfig, setSubtitleConfig] = useAtom(configFields.subtitle)

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-medium">
        Subtitle Translation
      </span>
      <Switch
        checked={subtitleConfig.enabled}
        onCheckedChange={(checked) => {
          setSubtitleConfig({ ...subtitleConfig, enabled: checked })
        }}
      />
    </div>
  )
}
