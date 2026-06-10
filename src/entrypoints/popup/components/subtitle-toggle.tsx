import { useAtom } from 'jotai'
import { Captions } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/utils/tailwind'
import { configFields } from '@/utils/atoms/config'

/**
 * Subtitle translation toggle for the popup panel.
 * Enables/disables video subtitle translation globally.
 */
export default function SubtitleToggle() {
  const [subtitle, setSubtitle] = useAtom(configFields.subtitle)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Captions className={cn(
          'h-4 w-4',
          subtitle.enabled ? 'text-neutral-500' : 'text-neutral-400',
        )}
        strokeWidth={1.6}
        />
        <span className={cn(
          'text-[13px] font-medium',
          subtitle.enabled ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400',
        )}
        >
          Subtitle Translation
        </span>
      </div>
      <Switch
        checked={subtitle.enabled}
        onCheckedChange={(checked) => {
          setSubtitle({ enabled: checked })
        }}
      />
    </div>
  )
}
