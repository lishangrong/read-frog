import { initializeConfig, isAnyAPIKey, loadAPIKeyFromEnv } from '@/utils/config/config'
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
      // Mark as fresh install for onboarding
      await storage.setItem<boolean>('local:__needsOnboarding', true)
    }
    await initializeConfig()
    await loadAPIKeyFromEnv()

    // Check if user needs onboarding (fresh install with no API keys)
    if (details.reason === 'install') {
      const config = await storage.getItem('local:config') as any
      if (!config || !isAnyAPIKey(config.providersConfig ?? {})) {
        await storage.setItem<boolean>('local:__needsOnboarding', true)
      }

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

  newUserGuide()
  translationMessage()

  setUpRequestQueue()
})
