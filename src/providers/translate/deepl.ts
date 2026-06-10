import type {
  BatchTranslateRequest,
  BatchTranslateResult,
  ProviderContext,
  TranslateRequest,
  TranslateResult,
} from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseHttpTranslateProvider } from '../base-http-translate-provider'

export class DeepLProvider extends BaseHttpTranslateProvider {
  readonly id = 'deepl'
  readonly capabilities = PROVIDER_CAPABILITIES.deepl

  private resolveBaseURL(apiKey?: string): string {
    const isFreeKey = apiKey?.endsWith(':fx') ?? false
    return isFreeKey
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2'
  }

  async translate(ctx: ProviderContext, req: TranslateRequest): Promise<TranslateResult> {
    const baseURL = this.resolveBaseURL(ctx.apiKey)

    const params = new URLSearchParams({
      text: req.text,
      target_lang: req.targetLang.toUpperCase(),
    })
    if (req.sourceLang !== 'auto') {
      params.set('source_lang', req.sourceLang.toUpperCase())
    }

    const resp = await fetch(`${baseURL}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${ctx.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!resp.ok) {
      throw new Error(`DeepL API error: ${resp.status} ${resp.statusText}`)
    }

    const data = await resp.json() as {
      translations: Array<{ text: string, detected_source_language?: string }>
    }

    return {
      translatedText: data.translations[0].text,
      detectedSourceLang: data.translations[0].detected_source_language?.toLowerCase(),
    }
  }

  /** Override with DeepL's native batch endpoint */
  async batchTranslate(ctx: ProviderContext, req: BatchTranslateRequest): Promise<BatchTranslateResult> {
    const baseURL = this.resolveBaseURL(ctx.apiKey)

    const params = new URLSearchParams()
    req.items.forEach(item => params.append('text', item.text))
    params.set('target_lang', req.items[0].targetLang.toUpperCase())
    if (req.items[0].sourceLang !== 'auto') {
      params.set('source_lang', req.items[0].sourceLang.toUpperCase())
    }

    const resp = await fetch(`${baseURL}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${ctx.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!resp.ok) {
      throw new Error(`DeepL batch API error: ${resp.status} ${resp.statusText}`)
    }

    const data = await resp.json() as {
      translations: Array<{ text: string, detected_source_language?: string }>
    }

    return {
      results: data.translations.map(t => ({
        translatedText: t.text,
        detectedSourceLang: t.detected_source_language?.toLowerCase(),
      })),
    }
  }
}
