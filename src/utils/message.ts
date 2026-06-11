import { defineExtensionMessaging } from '@webext-core/messaging'

interface ProtocolMap {
  openOptionsPage: () => void
  // translation state
  getEnablePageTranslation: (data: { tabId: number }) => boolean | undefined
  setEnablePageTranslation: (data: { tabId: number, enabled: boolean }) => void
  setEnablePageTranslationOnContentScript: (data: { enabled: boolean }) => void
  resetPageTranslationOnNavigation: (data: { url: string }) => void
  // read article
  readArticle: () => void
  popupRequestReadArticle: (data: { tabId: number }) => void
  // user guide
  pinStateChanged: (data: { isPinned: boolean }) => void
  getPinState: () => boolean
  returnPinState: (data: { isPinned: boolean }) => void
  // request — legacy format (backward compat)
  enqueueRequest: (data: { type: string, params: Record<string, any>, scheduleAt: number, hash: string }) => Promise<any>
  // request — new unified format using provider registry
  translateRequest: (data: { providerId: string, text: string, sourceLang: string, targetLang: string, scheduleAt: number, hash: string }) => Promise<string>
  // TTS synthesis — calls OpenAI TTS API in background
  ttsSynthesize: (data: { text: string, voiceId: string, speed: number, model: string, format: string }) => Promise<{ audio: string }>
}

export const { sendMessage, onMessage }
  = defineExtensionMessaging<ProtocolMap>()
