import type { SubtitleCue } from './detector'
import type { SubtitleConfig } from '@/types/config/subtitle'
import React from 'react'
import textSmallCSS from '@/assets/tailwind/text-small.css?inline'
import themeCSS from '@/assets/tailwind/theme.css?inline'
import { createReactShadowHost, removeReactShadowHost } from '@/utils/react-shadow-host/create-shadow-host'
import { NOTRANSLATE_CLASS } from '@/utils/constants/dom-labels'
import { SubtitleOverlay } from '@/components/subtitle-overlay/subtitle-overlay'

const OVERLAY_HOST_CLASS = 'read-frog-subtitle-overlay-host'

let currentOverlayHost: HTMLElement | null = null
let resizeObserver: ResizeObserver | null = null
let fullscreenHandler: (() => void) | null = null

/**
 * Show or update the subtitle overlay near the video element.
 */
export function showSubtitleOverlay(
  originalCues: SubtitleCue[],
  translatedTexts: string[],
  config: SubtitleConfig,
) {
  const videoElement = findVideoElement()
  if (!videoElement)
    return

  // Remove old overlay and create a new one
  dismissSubtitleOverlay()

  const overlayElement = React.createElement(SubtitleOverlay, {
    originalCues,
    translatedTexts,
    displayMode: config.displayMode,
    fontSize: config.fontSize,
    opacity: config.opacity,
  })

  const host = createReactShadowHost(overlayElement, {
    position: 'block',
    inheritStyles: false,
    className: `${NOTRANSLATE_CLASS} ${OVERLAY_HOST_CLASS}`,
    cssContent: [themeCSS, textSmallCSS],
    style: {
      position: 'fixed',
      zIndex: '2147483646', // Just below the floating button
      pointerEvents: 'none',
    },
  })

  // Append to body (or fullscreen element)
  const container = document.fullscreenElement || document.body
  container.appendChild(host)
  currentOverlayHost = host

  // Position the overlay relative to the video
  positionOverlay(host, videoElement, config.position)

  // Watch for video resize
  resizeObserver = new ResizeObserver(() => {
    if (currentOverlayHost && videoElement) {
      positionOverlay(currentOverlayHost, videoElement, config.position)
    }
  })
  resizeObserver.observe(videoElement)

  // Handle fullscreen changes
  fullscreenHandler = () => {
    if (!currentOverlayHost)
      return
    const newContainer = document.fullscreenElement || document.body
    if (currentOverlayHost.parentElement !== newContainer) {
      newContainer.appendChild(currentOverlayHost)
    }
    if (videoElement) {
      positionOverlay(currentOverlayHost, videoElement, config.position)
    }
  }
  document.addEventListener('fullscreenchange', fullscreenHandler)
}

/**
 * Remove the subtitle overlay.
 */
export function dismissSubtitleOverlay() {
  if (currentOverlayHost) {
    removeReactShadowHost(currentOverlayHost)
    currentOverlayHost = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (fullscreenHandler) {
    document.removeEventListener('fullscreenchange', fullscreenHandler)
    fullscreenHandler = null
  }
}

/**
 * Check if the overlay is currently active.
 */
export function isOverlayActive(): boolean {
  return currentOverlayHost !== null
}

/**
 * Position the overlay relative to the video element.
 */
function positionOverlay(
  host: HTMLElement,
  video: HTMLVideoElement,
  position: SubtitleConfig['position'],
) {
  const rect = video.getBoundingClientRect()

  // Center horizontally relative to the video
  const overlayWidth = Math.min(rect.width * 0.9, 800)
  const left = rect.left + (rect.width - overlayWidth) / 2

  Object.assign(host.style, {
    width: `${overlayWidth}px`,
    textAlign: 'center',
  })

  switch (position) {
    case 'below':
      Object.assign(host.style, {
        left: `${left}px`,
        top: `${rect.bottom - 60}px`, // Slightly above the bottom of the video
      })
      break
    case 'above':
      Object.assign(host.style, {
        left: `${left}px`,
        top: `${rect.top + 10}px`,
      })
      break
    case 'side':
      Object.assign(host.style, {
        left: `${rect.right + 10}px`,
        top: `${rect.top + rect.height / 2 - 40}px`,
        width: '300px',
      })
      break
  }
}

function findVideoElement(): HTMLVideoElement | null {
  // YouTube
  if (window.location.hostname.includes('youtube.com')) {
    return document.querySelector('video.html5-main-video') || document.querySelector('video')
  }
  // Generic
  return document.querySelector('video')
}
