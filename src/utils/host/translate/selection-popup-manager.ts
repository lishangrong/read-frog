import type { SelectionTranslation } from '@/types/selection-translation'
import React from 'react'
import textSmallCSS from '@/assets/tailwind/text-small.css?inline'
import themeCSS from '@/assets/tailwind/theme.css?inline'
import { createReactShadowHost, removeReactShadowHost } from '@/utils/react-shadow-host/create-shadow-host'
import { NOTRANSLATE_CLASS } from '@/utils/constants/dom-labels'
import { SelectionPopup } from '@/components/selection-translation/selection-popup'
import { globalConfig } from '@/utils/config/config'

const POPUP_HOST_CLASS = 'read-frog-selection-popup-host'

let currentPopupHost: HTMLElement | null = null

export function showSelectionPopup(
  selectedText: string,
  position: { x: number, y: number, bottom: number },
  translationPromise: Promise<SelectionTranslation>,
) {
  dismissSelectionPopup()

  const popupElement = React.createElement(SelectionPopup, {
    selectedText,
    translationPromise,
    onDismiss: dismissSelectionPopup,
    ttsConfig: globalConfig?.tts,
    targetLang: globalConfig?.language?.targetCode,
  })

  const host = createReactShadowHost(popupElement, {
    position: 'block',
    inheritStyles: false,
    className: `${NOTRANSLATE_CLASS} ${POPUP_HOST_CLASS}`,
    cssContent: [themeCSS, textSmallCSS],
    style: {
      position: 'fixed',
      zIndex: '2147483647',
      left: `${clampX(position.x)}px`,
      top: `${clampY(position.bottom + 8)}px`,
    },
  })

  document.body.appendChild(host)
  currentPopupHost = host
}

export function dismissSelectionPopup() {
  if (currentPopupHost) {
    removeReactShadowHost(currentPopupHost)
    currentPopupHost = null
  }
}

export function isPopupActive(): boolean {
  return currentPopupHost !== null
}

function clampX(x: number): number {
  const maxX = window.innerWidth - 320 // popup min width ~320px
  return Math.max(8, Math.min(x, maxX))
}

function clampY(y: number): number {
  const maxY = window.innerHeight - 200 // leave room for popup
  if (y > maxY) {
    // Show above the selection instead
    return Math.max(8, y - 220)
  }
  return Math.max(8, y)
}
