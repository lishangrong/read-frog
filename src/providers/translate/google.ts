import type { ProviderContext, TranslateRequest, TranslateResult } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseHttpTranslateProvider } from '../base-http-translate-provider'

export class GoogleProvider extends BaseHttpTranslateProvider {
  readonly id = 'google'
  readonly capabilities = PROVIDER_CAPABILITIES.google

  async translate(_ctx: ProviderContext, req: TranslateRequest): Promise<TranslateResult> {
    const params = {
      client: 'gtx',
      sl: req.sourceLang,
      tl: req.targetLang,
      dt: 't',
      strip: 1,
      nonced: 1,
      q: encodeURIComponent(req.text),
    }

    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key as keyof typeof params]}`)
      .join('&')

    const resp = await fetch(
      `https://translate.googleapis.com/translate_a/single?${queryString}`,
      { method: 'GET' },
    ).catch((error) => {
      throw new Error(`Network error during translation: ${error.message}`)
    })

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'Unable to read error response')
      throw new Error(
        `Translation request failed: ${resp.status} ${resp.statusText}${errorText ? ` - ${errorText}` : ''}`,
      )
    }

    try {
      const result = await resp.json()

      if (!Array.isArray(result) || !Array.isArray(result[0])) {
        throw new TypeError('Unexpected response format from translation API')
      }

      const translatedText = result[0]
        .filter(Array.isArray)
        .map((chunk: string[]) => chunk[0])
        .filter(Boolean)
        .join('')

      return {
        translatedText,
        detectedSourceLang: result[2] as string | undefined,
      }
    }
    catch (error) {
      throw new Error(`Failed to parse translation response: ${(error as Error).message}`)
    }
  }
}
