import type { SubtitleConfig } from '@/types/config/subtitle'

export interface SubtitleCue {
  text: string
  startTime?: number
  endTime?: number
}

export type SubtitleChangeCallback = (cues: SubtitleCue[]) => void

/**
 * Detects video subtitles on the page (YouTube, HTML5 TextTrack).
 * Uses MutationObserver for YouTube and TextTrack events for generic HTML5 video.
 */
export class SubtitleDetector {
  private observer: MutationObserver | null = null
  private trackListeners: Array<{ track: TextTrack, handler: () => void }> = []
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private videoElement: HTMLVideoElement | null = null
  private callback: SubtitleChangeCallback
  private config: SubtitleConfig
  private isRunning = false

  constructor(callback: SubtitleChangeCallback, config: SubtitleConfig) {
    this.callback = callback
    this.config = config
  }

  updateConfig(config: SubtitleConfig) {
    this.config = config
  }

  start() {
    if (this.isRunning)
      return
    this.isRunning = true

    if (this.isYouTube()) {
      this.startYouTubeDetection()
    }
    else {
      this.startHTML5Detection()
    }
  }

  stop() {
    this.isRunning = false
    this.cleanup()
  }

  destroy() {
    this.stop()
    this.callback = () => {}
  }

  hasVideo(): boolean {
    return this.isYouTube() || !!document.querySelector('video')
  }

  private isYouTube(): boolean {
    return window.location.hostname.includes('youtube.com')
  }

  private cleanup() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    for (const { track, handler } of this.trackListeners) {
      track.removeEventListener('cuechange', handler)
    }
    this.trackListeners = []
  }

  /* ──────────────────────────────
    YouTube detection
    ────────────────────────────── */

  private startYouTubeDetection() {
    // Wait for the caption window to appear, then observe it
    const findAndObserve = () => {
      const captionWindow = document.querySelector('.caption-window')
      if (captionWindow) {
        this.observeYouTubeCaptions(captionWindow)
        return true
      }
      return false
    }

    if (!findAndObserve()) {
      // Caption window not yet in DOM — watch for it
      const bodyObserver = new MutationObserver(() => {
        if (findAndObserve()) {
          bodyObserver.disconnect()
        }
      })
      bodyObserver.observe(document.body, { childList: true, subtree: true })

      // Store for cleanup
      const originalObserver = this.observer
      this.observer = bodyObserver
      if (originalObserver) {
        originalObserver.disconnect()
      }
    }
  }

  private observeYouTubeCaptions(captionWindow: Element) {
    if (this.observer) {
      this.observer.disconnect()
    }

    this.observer = new MutationObserver(() => {
      this.debouncedExtractYouTubeCues()
    })

    this.observer.observe(captionWindow, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    // Also do an initial extract
    this.extractYouTubeCues()
  }

  private debouncedExtractYouTubeCues() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => {
      this.extractYouTubeCues()
    }, 200)
  }

  private extractYouTubeCues() {
    const segments = document.querySelectorAll('.ytp-caption-segment')
    if (segments.length === 0) {
      this.callback([])
      return
    }

    const cues: SubtitleCue[] = []
    for (const segment of segments) {
      const text = segment.textContent?.trim()
      if (text) {
        cues.push({ text })
      }
    }
    this.callback(cues)
  }

  /* ──────────────────────────────
    HTML5 TextTrack detection
    ────────────────────────────── */

  private startHTML5Detection() {
    const video = document.querySelector('video')
    if (!video)
      return
    this.videoElement = video

    const tracks = video.textTracks
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      if (track.kind === 'subtitles' || track.kind === 'captions') {
        this.attachTrackListener(track)
      }
    }

    // Watch for new tracks being added
    tracks.addEventListener('addtrack', (e) => {
      const track = (e as TrackEvent).track
      if (track && (track.kind === 'subtitles' || track.kind === 'captions')) {
        this.attachTrackListener(track)
      }
    })
  }

  private attachTrackListener(track: TextTrack) {
    const handler = () => {
      this.extractHTML5Cues(track)
    }
    track.addEventListener('cuechange', handler)
    this.trackListeners.push({ track, handler })

    // Extract any existing active cues
    if (track.activeCues && track.activeCues.length > 0) {
      this.extractHTML5Cues(track)
    }
  }

  private extractHTML5Cues(track: TextTrack) {
    if (!track.activeCues || track.activeCues.length === 0) {
      this.callback([])
      return
    }

    const cues: SubtitleCue[] = []
    for (let i = 0; i < track.activeCues.length; i++) {
      const cue = track.activeCues[i] as VTTCue
      if (cue.text) {
        cues.push({
          text: cue.text,
          startTime: cue.startTime,
          endTime: cue.endTime,
        })
      }
    }
    this.callback(cues)
  }
}
