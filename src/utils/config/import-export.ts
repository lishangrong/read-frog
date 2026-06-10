import type { Config } from '@/types/config/config'
import { configSchema } from '@/types/config/config'
import { CONFIG_SCHEMA_VERSION, DEFAULT_CONFIG } from '../constants/config'

/**
 * Config export envelope — wraps config data with metadata
 * for versioning and multi-device sync support.
 */
export interface ConfigExportEnvelope {
  /** Export format version for forward compatibility */
  version: number
  /** Schema version the config was validated against */
  schemaVersion: number
  /** ISO timestamp of export */
  exportedAt: string
  /** Application identifier */
  app: string
  /** The config data */
  config: Config
}

/**
 * Result of an import operation.
 */
export type ImportResult =
  | { success: true, config: Config, warnings: string[] }
  | { success: false, error: string }

// ─── Export ──────────────────────────────────────────────────────

/**
 * Serialize a config object into an export envelope.
 */
export function serializeConfig(config: Config): ConfigExportEnvelope {
  return {
    version: 1,
    schemaVersion: CONFIG_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'read-frog',
    config,
  }
}

/**
 * Convert a config envelope to a JSON string for file export.
 */
export function configToJson(envelope: ConfigExportEnvelope): string {
  return JSON.stringify(envelope, null, 2)
}

/**
 * Trigger a browser file download with the config JSON.
 */
export function downloadConfigFile(config: Config): void {
  const envelope = serializeConfig(config)
  const json = configToJson(envelope)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `read-frog-config-${timestamp}.json`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Import ──────────────────────────────────────────────────────

/**
 * Parse a JSON string into a config export envelope.
 * Validates the envelope structure but NOT the config data itself.
 */
export function parseEnvelope(json: string): ConfigExportEnvelope | null {
  try {
    const parsed = JSON.parse(json)
    if (
      parsed
      && typeof parsed === 'object'
      && parsed.app === 'read-frog'
      && typeof parsed.version === 'number'
      && typeof parsed.schemaVersion === 'number'
      && parsed.config
      && typeof parsed.config === 'object'
    ) {
      return parsed as ConfigExportEnvelope
    }
    return null
  }
  catch {
    return null
  }
}

/**
 * Validate an imported config against the current schema.
 * Returns the validated config or error details.
 */
export function validateImportedConfig(envelope: ConfigExportEnvelope): ImportResult {
  const warnings: string[] = []

  // Warn about schema version mismatch
  if (envelope.schemaVersion < CONFIG_SCHEMA_VERSION) {
    warnings.push(
      `Config was exported with schema v${envelope.schemaVersion}, current is v${CONFIG_SCHEMA_VERSION}. Some settings may be missing.`,
    )
  }
  if (envelope.schemaVersion > CONFIG_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Config was exported with a newer schema version (${envelope.schemaVersion}). Please update the extension first.`,
    }
  }

  const result = configSchema.safeParse(envelope.config)
  if (!result.success) {
    const issuePaths = result.error.issues.map(i => i.path.join('.')).join(', ')
    return {
      success: false,
      error: `Config validation failed. Invalid fields: ${issuePaths}`,
    }
  }

  return { success: true, config: result.data, warnings }
}

/**
 * Import config from a JSON file (File object from file input).
 * Validates and returns the parsed config.
 */
export async function importConfigFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    const envelope = parseEnvelope(text)

    if (!envelope) {
      return {
        success: false,
        error: 'Invalid config file format. Expected a Read Frog config export.',
      }
    }

    return validateImportedConfig(envelope)
  }
  catch {
    return {
      success: false,
      error: 'Failed to read config file. The file may be corrupted.',
    }
  }
}

/**
 * Import config from a JSON string (e.g., pasted text).
 */
export function importConfigFromString(json: string): ImportResult {
  const envelope = parseEnvelope(json)
  if (!envelope) {
    return {
      success: false,
      error: 'Invalid config format. Expected a Read Frog config export JSON.',
    }
  }
  return validateImportedConfig(envelope)
}

// ─── Selective Import/Export ────────────────────────────────────

/**
 * Export only specific config sections.
 */
export function exportConfigSections(config: Config, sections: (keyof Config)[]): Partial<Config> {
  const result = {} as Record<string, unknown>
  for (const key of sections) {
    if (key in config) {
      result[key] = config[key]
    }
  }
  return result as Partial<Config>
}

/**
 * Merge imported config sections into the current config.
 * Only overwrites the specified sections, preserving others.
 */
export function mergeImportedSections(
  currentConfig: Config,
  importedConfig: Config,
  sections: (keyof Config)[],
): Config {
  const merged = { ...currentConfig }
  for (const key of sections) {
    if (key in importedConfig) {
      (merged as any)[key] = importedConfig[key]
    }
  }
  // Re-validate the merged result
  const result = configSchema.safeParse(merged)
  return result.success ? result.data : currentConfig
}

/**
 * Get the default config for comparison during import preview.
 */
export function getDefaultConfig(): Config {
  return { ...DEFAULT_CONFIG }
}
