import type { ProviderContext, TranslateRequest, TranslateResult } from '@/types/provider/contract'
import { PROVIDER_CAPABILITIES } from '../capabilities-map'
import { BaseHttpTranslateProvider } from '../base-http-translate-provider'

async function refreshMicrosoftToken(): Promise<string> {
  try {
    const resp = await fetch('https://edge.microsoft.com/translate/auth')
    if (!resp.ok) {
      throw new Error(`Failed to refresh Microsoft token: ${resp.status} ${resp.statusText}`)
    }
    return await resp.text()
  }
  catch (error) {
    throw new Error(`Error refreshing Microsoft token: ${(error as Error).message}`)
  }
}

export class MicrosoftProvider extends BaseHttpTranslateProvider {
  readonly id = 'microsoft'
  readonly capabilities = PROVIDER_CAPABILITIES.microsoft

  async translate(_ctx: ProviderContext, req: TranslateRequest): Promise<TranslateResult> {
    const effectiveFromLang = req.sourceLang === 'auto' ? '' : req.sourceLang
    const token = await refreshMicrosoftToken()

    const resp = await fetch(
      `https://api-edge.cognitive.microsofttranslator.com/translate?from=${effectiveFromLang}&to=${req.targetLang}&api-version=3.0&includeSentenceLength=true&textType=html`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': token,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify([{ Text: req.text }]),
      },
    ).catch((error) => {
      throw new Error(`Network error during Microsoft translation: ${error.message}`)
    })

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'Unable to read error response')
      throw new Error(
        `Microsoft translation request failed: ${resp.status} ${resp.statusText}${errorText ? ` - ${errorText}` : ''}`,
      )
    }

    try {
      const result = await resp.json()

      if (!Array.isArray(result) || !result[0]?.translations?.[0]?.text) {
        throw new Error('Unexpected response format from Microsoft translation API')
      }

      return {
        translatedText: result[0].translations[0].text,
        detectedSourceLang: result[0].detectedLanguage?.language,
      }
    }
    catch (error) {
      throw new Error(`Failed to parse Microsoft translation response: ${(error as Error).message}`)
    }
  }
}
