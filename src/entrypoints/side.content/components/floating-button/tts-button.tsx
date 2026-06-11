import { useAtomValue, useSetAtom } from 'jotai'
import { Volume2, VolumeX } from 'lucide-react'

import { toast } from 'sonner'
import { configFields } from '@/utils/atoms/config'
import { hasSetAPIKey } from '@/utils/config/config'
import { getAudioController } from '@/utils/tts/audio-controller'
import { sanitizeTextForTts } from '@/utils/tts/text-sanitizer'
import { ttsPlaybackStateAtom } from '../../atoms'
import HiddenButton from './components/hidden-button'

export default function TtsButton() {
  const ttsState = useAtomValue(ttsPlaybackStateAtom)
  const ttsConfig = useAtomValue(configFields.tts)
  const providersConfig = useAtomValue(configFields.providersConfig)
  const language = useAtomValue(configFields.language)

  const isPlaying = ttsState !== 'idle'

  return (
    <HiddenButton
      Icon={isPlaying ? VolumeX : Volume2}
      onClick={() => {
        if (isPlaying) {
          getAudioController().stop()
          return
        }

        // Check API key for OpenAI provider
        if (ttsConfig.provider === 'openai' && !hasSetAPIKey('openai', providersConfig)) {
          toast.error(i18n.t('noConfig.warning'))
          return
        }

        // Get selected text or page title, sanitized for TTS
        const selectedText = window.getSelection()?.toString()?.trim()
        const text = sanitizeTextForTts(selectedText || document.title)

        if (!text) {
          toast.error('No text to read aloud')
          return
        }

        const controller = getAudioController()
        controller.speak(text, ttsConfig.provider, {
          voice: ttsConfig.voice,
          speed: ttsConfig.speed,
          lang: language.targetCode,
        }).catch((error) => {
          toast.error(`TTS error: ${error.message}`)
        })
      }}
    >
      {isPlaying && (
        <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-green-500" />
      )}
    </HiddenButton>
  )
}
