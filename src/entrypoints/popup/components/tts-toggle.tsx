import { useAtom } from 'jotai'
import { Volume2, VolumeX } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/utils/tailwind'
import { configFields } from '@/utils/atoms/config'

/**
 * TTS toggle switch for the popup panel.
 * Enables/disables the text-to-speech feature globally.
 */
export default function TTSToggle() {
  const [tts, setTts] = useAtom(configFields.tts)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {tts.enabled
          ? <Volume2 className="h-4 w-4 text-neutral-500" strokeWidth={1.6} />
          : <VolumeX className="h-4 w-4 text-neutral-400" strokeWidth={1.6} />}
        <span className={cn(
          'text-[13px] font-medium',
          tts.enabled ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400',
        )}
        >
          Text to Speech
        </span>
      </div>
      <Switch
        checked={tts.enabled}
        onCheckedChange={(checked) => {
          setTts({ enabled: checked })
        }}
      />
    </div>
  )
}
