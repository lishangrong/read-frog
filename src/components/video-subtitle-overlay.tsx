import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Captions } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/tailwind'
import {
  currentSubtitleCueAtom,
  displaySubtitleTextAtom,
  subtitleCuesAtom,
  subtitleErrorAtom,
  subtitleOverlayVisibleAtom,
  subtitleTranslationStateAtom,
  videoPlayerDetectedAtom,
} from '@/utils/atoms/subtitle'
import { configFields } from '@/utils/atoms/config'

/**
 * CSS class name used for the subtitle overlay container.
 * Must be unique to avoid conflicts with host page styles.
 */
const OVERLAY_CLASS = 'read-frog-subtitle-overlay'

/**
 * Supported video player selectors for subtitle extraction.
 */
const VIDEO_PLAYER_SELECTORS = {
  youtube: '.html5-video-player',
  generic: 'video',
} as const

/**
 * Format seconds into HH:MM:SS.ms display format.
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`
}

/**
 * Video Subtitle Translation Overlay component.
 *
 * Integrates with video players (YouTube, generic HTML5 video) to:
 * - Detect and monitor subtitle/caption tracks
 * - Translate subtitle cues in real-time
 * - Display translated subtitles as a non-intrusive overlay
 *
 * The overlay is positioned relative to the video player element
 * and does not interfere with native controls or playback.
 */
export default function VideoSubtitleOverlay() {
  const [overlayVisible, setOverlayVisible] = useAtom(subtitleOverlayVisibleAtom)
  const [translationState, setTranslationState] = useAtom(subtitleTranslationStateAtom)
  const displayText = useAtomValue(displaySubtitleTextAtom)
  const currentCue = useAtomValue(currentSubtitleCueAtom)
  const videoDetected = useAtomValue(videoPlayerDetectedAtom)
  const subtitleConfig = useAtomValue(configFields.subtitle)
  const setCues = useSetAtom(subtitleCuesAtom)
  const setCurrentCue = useSetAtom(currentSubtitleCueAtom)
  const setVideoDetected = useSetAtom(videoPlayerDetectedAtom)
  const setError = useSetAtom(subtitleErrorAtom)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const rafRef = useRef<number | null>(null)

  /**
   * Detect video players on the page and set up subtitle monitoring.
   */
  useEffect(() => {
    if (!subtitleConfig.enabled)
      return

    const detectVideoPlayer = () => {
      // Check for YouTube player
      const ytPlayer = document.querySelector(VIDEO_PLAYER_SELECTORS.youtube)
      const videoEl = ytPlayer?.querySelector('video') || document.querySelector('video')

      if (videoEl && videoEl !== videoRef.current) {
        videoRef.current = videoEl
        setVideoDetected(true)
        setupSubtitleMonitor(videoEl)
      }
      else if (!videoEl) {
        setVideoDetected(false)
      }
    }

    // Initial detection
    detectVideoPlayer()

    // Watch for dynamically added video elements (SPAs)
    const pageObserver = new MutationObserver(() => {
      detectVideoPlayer()
    })

    pageObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      pageObserver.disconnect()
      cleanupSubtitleMonitor()
    }
  }, [subtitleConfig.enabled, setVideoDetected])

  /**
   * Set up subtitle monitoring for a detected video element.
   */
  const setupSubtitleMonitor = useCallback((video: HTMLVideoElement) => {
    cleanupSubtitleMonitor()

    // Monitor YouTube subtitle container
    const ytCaptionContainer = document.querySelector('.ytp-caption-window-container')
    if (ytCaptionContainer) {
      observerRef.current = new MutationObserver(() => {
        extractYouTubeSubtitles()
      })
      observerRef.current.observe(ytCaptionContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    // Also monitor HTML5 text tracks
    const textTracks = video.textTracks
    if (textTracks.length > 0) {
      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].addEventListener('cuechange', handleCueChange as EventListener)
      }
    }

    // Poll for subtitle updates (fallback for players without standard APIs)
    const pollSubtitles = () => {
      if (videoRef.current && !videoRef.current.paused) {
        extractYouTubeSubtitles()
      }
      rafRef.current = requestAnimationFrame(pollSubtitles)
    }
    rafRef.current = requestAnimationFrame(pollSubtitles)
  }, [])

  /**
   * Clean up subtitle monitoring resources.
   */
  const cleanupSubtitleMonitor = useCallback(() => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    // Remove text track listeners
    if (videoRef.current?.textTracks) {
      const tracks = videoRef.current.textTracks
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].removeEventListener('cuechange', handleCueChange as EventListener)
      }
    }
  }, [])

  /**
   * Extract subtitle text from YouTube's caption window.
   */
  const extractYouTubeSubtitles = useCallback(() => {
    const captionWindow = document.querySelector('.ytp-caption-window-container .captions-text')
    if (!captionWindow) {
      setCurrentCue(null)
      return
    }

    const text = (captionWindow.textContent || '').trim()
    if (!text) {
      setCurrentCue(null)
      return
    }

    const currentTime = videoRef.current?.currentTime ?? 0

    // Check if this is a new cue (different text)
    setCurrentCue((prev: any) => {
      if (prev && prev.originalText === text)
        return prev

      const newCue = {
        startTime: currentTime,
        endTime: currentTime + 3,
        originalText: text,
        translatedText: '',
        index: (prev?.index ?? -1) + 1,
      }

      // Dispatch translation request
      if (subtitleConfig.autoTranslate) {
        const event = new CustomEvent('read-frog:translate-subtitle', {
          detail: { text, index: newCue.index },
        })
        document.dispatchEvent(event)
      }

      return newCue
    })

    setOverlayVisible(true)
  }, [subtitleConfig.autoTranslate, setCurrentCue, setOverlayVisible])

  /**
   * Handle HTML5 text track cue changes.
   */
  const handleCueChange = useCallback((event: Event) => {
    const track = event.target as TextTrack
    const activeCues = track.activeCues
    if (!activeCues || activeCues.length === 0) {
      setCurrentCue(null)
      return
    }

    const cue = activeCues[0] as VTTCue
    setCurrentCue({
      startTime: cue.startTime,
      endTime: cue.endTime,
      originalText: cue.text,
      translatedText: '',
      index: 0,
    })
    setOverlayVisible(true)

    if (subtitleConfig.autoTranslate) {
      const translateEvent = new CustomEvent('read-frog:translate-subtitle', {
        detail: { text: cue.text, index: 0 },
      })
      document.dispatchEvent(translateEvent)
    }
  }, [subtitleConfig.autoTranslate, setCurrentCue, setOverlayVisible])

  /**
   * Listen for translated subtitle responses.
   */
  useEffect(() => {
    const handleTranslatedSubtitle = (e: Event) => {
      const detail = (e as CustomEvent).detail as { index: number, translatedText: string }
      setCurrentCue((prev: any) => {
        if (prev && prev.index === detail.index) {
          return { ...prev, translatedText: detail.translatedText }
        }
        return prev
      })
    }

    document.addEventListener('read-frog:subtitle-translated', handleTranslatedSubtitle)
    return () => document.removeEventListener('read-frog:subtitle-translated', handleTranslatedSubtitle)
  }, [setCurrentCue])

  // Compute position relative to the video player
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const updatePosition = () => {
      const video = videoRef.current
      if (!video)
        return

      const rect = video.getBoundingClientRect()
      setOverlayStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        bottom: `${window.innerHeight - rect.bottom + 60}px`,
        zIndex: 2147483646,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const interval = setInterval(updatePosition, 500)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
      clearInterval(interval)
    }
  }, [videoDetected])

  if (!subtitleConfig.enabled || !videoDetected)
    return null

  return (
    <>
      {/* Toggle button - appears in the video player area */}
      <button
        type="button"
        title={overlayVisible ? 'Hide subtitle overlay' : 'Show subtitle overlay'}
        className={cn(
          'fixed z-[2147483647] flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
          'border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur-sm',
          'hover:bg-primary hover:text-white',
          'dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-400',
          overlayVisible && 'bg-primary text-white',
        )}
        style={{
          right: '16px',
          top: '16px',
        }}
        onClick={() => setOverlayVisible(!overlayVisible)}
      >
        <Captions className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span>CC</span>
      </button>

      {/* Subtitle overlay */}
      {overlayVisible && displayText && (
        <div
          className={cn(
            OVERLAY_CLASS,
            'pointer-events-none flex justify-center',
          )}
          style={overlayStyle}
        >
          <div
            className={cn(
              'max-w-[80%] rounded-md px-4 py-2 text-center text-sm leading-relaxed shadow-lg',
              'bg-black/75 text-white backdrop-blur-sm',
            )}
          >
            {displayText}
          </div>
        </div>
      )}

      {/* Translation state indicator */}
      {overlayVisible && translationState === 'translating' && (
        <div
          className="pointer-events-none fixed z-[2147483646] flex items-center gap-1"
          style={{
            right: '60px',
            top: '18px',
          }}
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-[10px] text-neutral-500">translating</span>
        </div>
      )}
    </>
  )
}
