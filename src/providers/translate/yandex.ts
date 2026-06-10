import type { ProviderContext, TranslateRequest, TranslateResult } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseHttpTranslateProvider } from '../base-http-translate-provider'

export class YandexProvider extends BaseHttpTranslateProvider {
  readonly id = 'yandex'
  readonly capabilities = PROVIDER_CAPABILITIES.yandex

  async translate(ctx: ProviderContext, req: TranslateRequest): Promise<TranslateResult> {
    const effectiveFromLang = req.sourceLang === 'auto' ? '' : req.sourceLang

    const resp = await fetch(
      `https://translate.api.cloud.yandex.net/translate/v2/translate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${ctx.apiKey}`,
        },
        body: JSON.stringify({
          sourceLanguageCode: effectiveFromLang,
          targetLanguageCode: req.targetLang,
          texts: [req.text],
        }),
      },
    )

    if (!resp.ok) {
      throw new Error(`Yandex API error: ${resp.status} ${resp.statusText}`)
    }

    const data = await resp.json() as {
      translations: Array<{ text: string, detectedLanguageCode?: string }>
    }

    return {
      translatedText: data.translations[0].text,
      detectedSourceLang: data.translations[0].detectedLanguageCode,
    }
  }
}
