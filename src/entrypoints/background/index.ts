import { initializeConfig, loadAPIKeyFromEnv } from '@/utils/config/config'
import { CONFIG_SCHEMA_VERSION } from '@/utils/constants/config'
import { newUserGuide } from './new-user-guide'
import { setUpRequestQueue } from './request-queue'
import { translationMessage } from './translation'

export default defineBackground(() => {
  logger.info('Hello background!', { id: browser.runtime.id })

  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      await storage.setItem<number>(
        'local:__configSchemaVersion',
        CONFIG_SCHEMA_VERSION,
      )
    }
    await initializeConfig()
    await loadAPIKeyFromEnv()
    // Open tutorial page when extension is installed
    if (details.reason === 'install') {
      await browser.tabs.create({
        url: 'https://readfrog.app/guide/step-1',
      })
    }
  })

  onMessage('openOptionsPage', () => {
    logger.info('openOptionsPage')
    browser.runtime.openOptionsPage()
  })

  onMessage('popupRequestReadArticle', async (message) => {
    sendMessage('readArticle', undefined, message.data.tabId)
  })

  // Subtitle state management (per-tab)
  const tabSubtitleState = new Map<number, boolean>()

  onMessage('getSubtitleEnabled', (msg) => {
    const { tabId } = msg.data
    return tabSubtitleState.get(tabId)
  })

  onMessage('setSubtitleEnabled', (msg) => {
    const { tabId, enabled } = msg.data
    tabSubtitleState.set(tabId, enabled)
  })

  newUserGuide()
  translationMessage()

  setUpRequestQueue()
})
