import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { configFields } from '@/utils/atoms/config'
import { getAudioController } from '@/utils/tts/audio-controller'
import { sanitizeTextForTts } from '@/utils/tts/text-sanitizer'
import { ttsCurrentTextAtom, ttsPlaybackStateAtom, ttsProgressAtom } from '@/entrypoints/side.content/atoms'
import { SpeedSlider } from './speed-slider'
import { VoiceSelector } from './voice-selector'
import { ProgressBar } from './progress-bar'

export function TtsPanel() {
  const ttsConfig = useAtomValue(configFields.tts)
  const language = useAtomValue(configFields.language)
  const [ttsState, setTtsState] = useAtom(ttsPlaybackStateAtom)
  const currentText = useAtomValue(ttsCurrentTextAtom)
  const setProgress = useSetAtom(ttsProgressAtom)
  const progress = useAtomValue(ttsProgressAtom)

  const controller = getAudioController()

  // Sync controller state and progress with atoms
  useEffect(() => {
    controller.onStateChange = (state) => {
      setTtsState(state)
    }
    controller.onProgress = (current, total) => {
      setProgress({ current, total })
    }
    return () => {
      controller.onStateChange = null
      controller.onProgress = null
    }
  }, [controller, setTtsState, setProgress])

  const handlePlay = () => {
    const selectedText = window.getSelection()?.toString()?.trim()
    const text = sanitizeTextForTts(selectedText || document.title)
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
    setProgress({ current: 0, total: 0 })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">TTS</span>
        <div className="flex items-center gap-1">
          {/* Skip Back */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => controller.skipBackward()}
            disabled={ttsState === 'idle'}
          >
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          {/* Play / Pause */}
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
          {/* Skip Forward */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => controller.skipForward()}
            disabled={ttsState === 'idle'}
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          {/* Stop */}
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

      {/* Progress bar */}
      {ttsState !== 'idle' && progress.total > 0 && (
        <ProgressBar current={progress.current} total={progress.total} />
      )}

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
