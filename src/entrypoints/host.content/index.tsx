// import eruda from 'eruda'
import type { SubtitleCue } from '@/utils/host/subtitle/detector'
import { globalConfig, loadGlobalConfigPromise } from '@/utils/config/config'
import { shouldAutoEnable } from '@/utils/host/translate/auto-translation'
import { SubtitleDetector } from '@/utils/host/subtitle/detector'
import { translateSubtitle, clearSubtitleCache } from '@/utils/host/subtitle/subtitle-translator'
import { showSubtitleOverlay, dismissSubtitleOverlay } from '@/utils/host/subtitle/overlay-manager'
import { registerTranslationTriggers } from './translation-trigger'
import { PageTranslationManager } from './translation-trigger/page-translation'
import './listen'
import './style.css'

export default defineContentScript({
  matches: ['*://*/*'],
  async main() {
    await loadGlobalConfigPromise
    // eruda.init()
    registerTranslationTriggers()

    const port = browser.runtime.connect({ name: 'translation-host.content' })
    const manager = new PageTranslationManager({
      root: null,
      rootMargin: '1000px',
      threshold: 0.1,
    })

    // Subtitle detection
    let subtitleDetector: SubtitleDetector | null = null
    if (globalConfig?.subtitle.enabled && globalConfig.subtitle.autoDetect) {
      subtitleDetector = new SubtitleDetector(
        handleSubtitleChange,
        globalConfig.subtitle,
      )
      // Delay start to let video player DOM settle
      setTimeout(() => {
        if (subtitleDetector?.hasVideo()) {
          subtitleDetector.start()
        }
      }, 1500)
    }

    async function handleSubtitleChange(cues: SubtitleCue[]) {
      if (!globalConfig || cues.length === 0) {
        dismissSubtitleOverlay()
        return
      }

      // Show overlay immediately with loading state
      showSubtitleOverlay(cues, [], globalConfig.subtitle)

      // Translate each cue
      const translations = await Promise.all(
        cues.map(cue => translateSubtitle(cue.text).catch(() => '')),
      )

      // Update overlay with translations
      showSubtitleOverlay(cues, translations, globalConfig.subtitle)
    }

    // Watch for subtitle config changes
    storage.watch<any>('local:config', (newConfig) => {
      if (!newConfig?.subtitle)
        return
      if (newConfig.subtitle.enabled && newConfig.subtitle.autoDetect) {
        if (!subtitleDetector) {
          subtitleDetector = new SubtitleDetector(
            handleSubtitleChange,
            newConfig.subtitle,
          )
        }
        else {
          subtitleDetector.updateConfig(newConfig.subtitle)
        }
        if (subtitleDetector.hasVideo()) {
          subtitleDetector.start()
        }
      }
      else {
        subtitleDetector?.stop()
        dismissSubtitleOverlay()
      }
    })

    const handleUrlChange = (from: string, to: string) => {
      if (from !== to) {
        logger.info('URL changed from', from, 'to', to)
        if (manager.isActive) {
          manager.stop()
        }
        // Reset subtitle detection on navigation
        subtitleDetector?.stop()
        dismissSubtitleOverlay()
        clearSubtitleCache()
        // Re-detect subtitles after DOM settles
        setTimeout(() => {
          if (subtitleDetector?.hasVideo()) {
            subtitleDetector.start()
          }
        }, 1500)
        // 通知 background script URL 已变化，让它决定是否自动启用翻译
        sendMessage('resetPageTranslationOnNavigation', { url: to })
      }
    }

    window.addEventListener('extension:urlchange', (e: any) => {
      const { from, to, reason } = e.detail
      logger.info('URL changed from', from, 'to', to, 'reason', reason)
      handleUrlChange(from, to)
    })

    port.onMessage.addListener((msg) => {
      logger.info('onMessage', msg)
      if (msg.type !== 'STATUS_PUSH' || msg.enabled === manager.isActive)
        return
      msg.enabled ? manager.start() : manager.stop()
    })

    // ! Temporary code for browser has no port.onMessage.addListener api like Orion
    const autoEnable = globalConfig && await shouldAutoEnable(window.location.href, globalConfig)
    if (autoEnable && !manager.isActive)
      manager.start()
  },
})
