import { useAtomValue } from 'jotai'
import { Captions, Check } from 'lucide-react'

import { toast } from 'sonner'
import { configFields } from '@/utils/atoms/config'
import { subtitleEnabledAtom } from '../../atoms'
import HiddenButton from './components/hidden-button'

export default function SubtitleButton() {
  const subtitleEnabled = useAtomValue(subtitleEnabledAtom)
  const subtitleConfig = useAtomValue(configFields.subtitle)

  if (!subtitleConfig.autoDetect) {
    return null
  }

  return (
    <HiddenButton
      Icon={Captions}
      onClick={() => {
        sendMessage('setSubtitleEnabled', {
          tabId: 0, // Will be resolved by sender tab in background
          enabled: !subtitleEnabled,
        }).catch(() => {
          toast.error('Failed to toggle subtitle translation')
        })
      }}
    >
      <Check
        className={cn(
          'absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-green-500 text-white',
          subtitleEnabled ? 'block' : 'hidden',
        )}
      />
    </HiddenButton>
  )
}
