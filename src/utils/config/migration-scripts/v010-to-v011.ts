import deepmerge from 'deepmerge'

/**
 * Migration from v10 to v11:
 * - TTS voice field broadened from enum to string (existing values remain valid)
 * - No default changes needed; new Edge TTS provider added at schema level
 */
export function migrate(oldConfig: any): any {
  return deepmerge(oldConfig, {})
}
