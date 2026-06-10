import type { Config } from '@/types/config/config'
import type { APIProviderNames } from '@/types/config/provider'
import { configSchema } from '@/types/config/config'
import { apiProviderNames } from '@/types/config/provider'
import { z } from 'zod'

import { CONFIG_SCHEMA_VERSION } from '../constants/config'

export interface ConfigExportData {
  meta: {
    version: string
    schemaVersion: number
    exportedAt: string
  }
  config: Config
}

export const configExportSchema = z.object({
  meta: z.object({
    version: z.string(),
    schemaVersion: z.number().int().positive(),
    exportedAt: z.string(),
  }),
  config: configSchema,
})

function sanitizeAPIKeys(config: Config): Config {
  const sanitized = structuredClone(config)
  for (const provider of apiProviderNames) {
    if (sanitized.providersConfig[provider]?.apiKey) {
      sanitized.providersConfig[provider] = {
        ...sanitized.providersConfig[provider],
        apiKey: '',
      }
    }
  }
  return sanitized
}

export function exportConfigToFile(config: Config, options: { includeAPIKeys: boolean }) {
  const exportConfig = options.includeAPIKeys ? config : sanitizeAPIKeys(config)

  const exportData: ConfigExportData = {
    meta: {
      version: browser.runtime.getManifest().version,
      schemaVersion: CONFIG_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    },
    config: exportConfig,
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  a.download = `read-frog-config-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
