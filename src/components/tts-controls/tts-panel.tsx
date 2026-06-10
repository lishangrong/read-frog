import { useAtom, useAtomValue } from 'jotai'
import { Pause, Play, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { configFields } from '@/utils/atoms/config'
import { getAudioController } from '@/utils/tts/audio-controller'
import { ttsCurrentTextAtom, ttsPlaybackStateAtom } from '@/entrypoints/side.content/atoms'
import { SpeedSlider } from './speed-slider'
import { VoiceSelector } from './voice-selector'

export function TtsPanel() {
  const ttsConfig = useAtomValue(configFields.tts)
  const language = useAtomValue(configFields.language)
  const [ttsState, setTtsState] = useAtom(ttsPlaybackStateAtom)
  const currentText = useAtomValue(ttsCurrentTextAtom)

  const controller = getAudioController()

  // Sync controller state with atom
  useEffect(() => {
    controller.onStateChange = (state) => {
      setTtsState(state)
    }
    return () => {
      controller.onStateChange = null
    }
  }, [controller, setTtsState])

  const handlePlay = () => {
    const selectedText = window.getSelection()?.toString()?.trim()
    const text = selectedText || document.title
    if (!text)
      return

    controller.speak(text, ttsConfig.provider, {
      voice: ttsConfig.voice,
      speed: ttsConfig.speed,
      lang: language.targetCode,
    })
  }

  const handlePause = () => {
    if (ttsState === 'playing') {
      controller.pause()
    }
    else if (ttsState === 'paused') {
      controller.resume()
    }
  }

  const handleStop = () => {
    controller.stop()
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">TTS</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={ttsState === 'idle' ? handlePlay : handlePause}
          >
            {ttsState === 'playing'
              ? <Pause className="h-3.5 w-3.5" />
              : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleStop}
            disabled={ttsState === 'idle'}
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <SpeedSlider />
      <VoiceSelector />

      {currentText && ttsState !== 'idle' && (
        <div className="truncate text-xs text-muted-foreground">
          {currentText}
        </div>
      )}
    </div>
  )
}
