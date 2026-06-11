import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Pause, Play, SkipBack, SkipForward, Square, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/tailwind'
import {
  AVAILABLE_TTS_VOICES,
  TTS_SPEED_PRESETS,
  ttsCacheStatusAtom,
  ttsErrorAtom,
  ttsPlaybackStateAtom,
  ttsProgressAtom,
  ttsProviderAtom,
  ttsSelectedVoiceAtom,
  ttsSpeedAtom,
  ttsTextAtom,
  ttsVoiceIdAtom,
  ttsVoicesForProviderAtom,
  ttsVolumeAtom,
} from '@/utils/atoms/tts'
import type { TTSProviderId } from '@/utils/tts/types'

/**
 * Format a speed value for display (e.g. "1.5x").
 */
function formatSpeed(speed: number): string {
  return `${speed % 1 === 0 ? speed.toFixed(0) : speed.toFixed(2)}x`
}

/**
 * Format seconds to mm:ss display.
 */
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * TTS provider options.
 */
const TTS_PROVIDERS: { value: TTSProviderId, label: string }[] = [
  { value: 'web-speech', label: 'Web Speech (Free)' },
  { value: 'openai', label: 'OpenAI TTS' },
]

/**
 * TTS Control Panel component.
 *
 * Provides a full-featured text-to-speech control surface:
 * - Provider selector (Web Speech / OpenAI TTS)
 * - Voice selector (filtered by provider and language)
 * - Speed control (0.25x – 4.0x) via slider + preset buttons
 * - Play / Pause / Stop transport controls
 * - Skip forward/backward buttons
 * - Progress bar with seek and time display
 * - Volume slider
 * - Cache status indicator
 * - Error display
 */
export default function TTSControlPanel() {
  const [playbackState, setPlaybackState] = useAtom(ttsPlaybackStateAtom)
  const [ttsText, setTtsText] = useAtom(ttsTextAtom)
  const [speed, setSpeed] = useAtom(ttsSpeedAtom)
  const [voiceId, setVoiceId] = useAtom(ttsVoiceIdAtom)
  const [volume, setVolume] = useAtom(ttsVolumeAtom)
  const [provider, setProvider] = useAtom(ttsProviderAtom)
  const [progress, setProgress] = useAtom(ttsProgressAtom)
  const cacheStatus = useAtomValue(ttsCacheStatusAtom)
  const availableVoices = useAtomValue(ttsVoicesForProviderAtom)
  const error = useAtomValue(ttsErrorAtom)

  const [inputText, setInputText] = useState(ttsText)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Sync external text updates into the input field
  useEffect(() => {
    setInputText(ttsText)
  }, [ttsText])

  /**
   * Start TTS playback.
   * Dispatches a custom event consumed by the TTS engine.
   */
  const handlePlay = useCallback(() => {
    if (!inputText.trim())
      return

    setTtsText(inputText)
    setPlaybackState('loading')
    setProgress({ currentTime: 0, duration: 0, percentage: 0 })

    const event = new CustomEvent('read-frog:tts-play', {
      detail: { text: inputText, speed, voiceId, volume, provider, model: 'tts-1', format: 'mp3' },
    })
    document.dispatchEvent(event)
  }, [inputText, speed, voiceId, volume, provider, setTtsText, setPlaybackState, setProgress])

  const handlePause = useCallback(() => {
    const event = new CustomEvent('read-frog:tts-pause', {})
    document.dispatchEvent(event)
  }, [])

  const handleResume = useCallback(() => {
    const event = new CustomEvent('read-frog:tts-resume', {})
    document.dispatchEvent(event)
  }, [])

  const handleStop = useCallback(() => {
    setTtsText('')
    setInputText('')
    setProgress({ currentTime: 0, duration: 0, percentage: 0 })
    const event = new CustomEvent('read-frog:tts-stop', {})
    document.dispatchEvent(event)
  }, [setTtsText, setProgress])

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    if (playbackState === 'playing') {
      const event = new CustomEvent('read-frog:tts-set-speed', {
        detail: { speed: newSpeed },
      })
      document.dispatchEvent(event)
    }
  }, [setSpeed, playbackState])

  const handleSkip = useCallback((seconds: number) => {
    const event = new CustomEvent('read-frog:tts-skip', {
      detail: { seconds },
    })
    document.dispatchEvent(event)
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || progress.duration <= 0) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const percentage = ((e.clientX - rect.left) / rect.width) * 100

    const event = new CustomEvent('read-frog:tts-seek', {
      detail: { percentage: Math.max(0, Math.min(100, percentage)) },
    })
    document.dispatchEvent(event)
  }, [progress.duration])

  const handleProviderChange = useCallback((newProvider: string) => {
    setProvider(newProvider as TTSProviderId)
    // Reset voice to first available for the new provider
    // Voice will be set when the voices list updates
  }, [setProvider])

  const isIdle = playbackState === 'idle'
  const isLoading = playbackState === 'loading'
  const isPlaying = playbackState === 'playing'
  const isPaused = playbackState === 'paused'
  const isOpenAI = provider === 'openai'

  return (
    <Card className="gap-3 py-3">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Volume2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
          Text to Speech
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        {/* Text input area */}
        <textarea
          className={cn(
            'w-full resize-none rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            'dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
            'placeholder:text-neutral-400',
          )}
          rows={3}
          placeholder="Enter text to read aloud, or select text on the page..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />

        {/* Provider selector */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-xs font-medium text-neutral-500 dark:text-neutral-400">Engine</span>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger size="sm" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TTS_PROVIDERS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice selector */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-xs font-medium text-neutral-500 dark:text-neutral-400">Voice</span>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger size="sm" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map(voice => (
                <SelectItem key={voice.id} value={voice.id}>
                  <span className="flex items-center gap-2">
                    {voice.name}
                    <span className="text-xs text-neutral-400">
                      ({voice.gender}
                      {voice.lang !== 'en' ? `, ${voice.lang}` : ''}
                      )
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speed control */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs font-medium text-neutral-500 dark:text-neutral-400">Speed</span>
            <input
              type="range"
              min={0.25}
              max={4.0}
              step={0.25}
              value={speed}
              onChange={e => handleSpeedChange(Number.parseFloat(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-primary dark:bg-neutral-700"
            />
            <span className="w-10 text-right text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
              {formatSpeed(speed)}
            </span>
          </div>
          {/* Speed preset buttons */}
          <div className="flex flex-wrap gap-1 pl-16">
            {TTS_SPEED_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                  speed === preset
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
                )}
                onClick={() => handleSpeedChange(preset)}
              >
                {formatSpeed(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar (AI TTS only) */}
        {isOpenAI && (isPlaying || isPaused || isLoading) && (
          <div className="flex flex-col gap-1">
            <div
              ref={progressBarRef}
              className="cursor-pointer"
              onClick={handleProgressClick}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percentage}
              tabIndex={0}
            >
              <Progress value={progress.percentage} className="h-2" />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
              <span>{formatTime(progress.currentTime)}</span>
              <span>{formatTime(progress.duration)}</span>
            </div>
          </div>
        )}

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-14 text-neutral-500 dark:text-neutral-400"
            onClick={() => setVolume(volume > 0 ? 0 : 1)}
          >
            {volume > 0
              ? <Volume2 className="h-3.5 w-3.5" strokeWidth={1.8} />
              : <VolumeX className="h-3.5 w-3.5" strokeWidth={1.8} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => setVolume(Number.parseFloat(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-primary dark:bg-neutral-700"
          />
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {isIdle && (
            <Button
              size="sm"
              onClick={handlePlay}
              disabled={!inputText.trim()}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" />
              Play
              {cacheStatus.isCached && (
                <span className="ml-1 rounded bg-green-100 px-1 py-0.5 text-[8px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  Cached
                </span>
              )}
            </Button>
          )}

          {isLoading && (
            <Button size="sm" variant="outline" disabled className="gap-1.5">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
              Loading...
            </Button>
          )}

          {isPlaying && (
            <>
              {/* Skip backward */}
              {isOpenAI && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSkip(-10)}
                  title="Rewind 10s"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                className="gap-1.5"
              >
                <Pause className="h-3.5 w-3.5" fill="currentColor" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStop}
                className="gap-1.5"
              >
                <Square className="h-3.5 w-3.5" fill="currentColor" />
                Stop
              </Button>
              {/* Skip forward */}
              {isOpenAI && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSkip(10)}
                  title="Forward 10s"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}

          {isPaused && (
            <>
              <Button
                size="sm"
                onClick={handleResume}
                className="gap-1.5"
              >
                <Play className="h-3.5 w-3.5" fill="currentColor" />
                Resume
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStop}
                className="gap-1.5"
              >
                <Square className="h-3.5 w-3.5" fill="currentColor" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Cache status indicator */}
        {cacheStatus.isPreloading && (
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            Preloading audio...
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
