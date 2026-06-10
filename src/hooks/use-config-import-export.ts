import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useRef, useState } from 'react'

import { toast } from 'sonner'
import { configAtom, replaceConfigAtom } from '@/utils/atoms/config'
import {
  downloadConfigFile,
  exportConfigSections,
  importConfigFromFile,
  type ImportResult,
} from '@/utils/config/import-export'
import type { Config } from '@/types/config/config'

/**
 * Hook for config export functionality.
 */
export function useConfigExport() {
  const config = useAtomValue(configAtom)
  const [exporting, setExporting] = useState(false)

  const exportAll = useCallback(() => {
    setExporting(true)
    try {
      downloadConfigFile(config)
      toast.success('Configuration exported successfully')
    }
    catch (error) {
      toast.error('Failed to export configuration')
    }
    finally {
      setExporting(false)
    }
  }, [config])

  const exportSections = useCallback((sections: (keyof Config)[]) => {
    setExporting(true)
    try {
      const partial = exportConfigSections(config, sections)
      // Create a full config with defaults for unselected sections, then download
      const exportConfig = { ...config, ...partial }
      downloadConfigFile(exportConfig)
      toast.success('Selected configuration sections exported')
    }
    catch {
      toast.error('Failed to export configuration')
    }
    finally {
      setExporting(false)
    }
  }, [config])

  return { exportAll, exportSections, exporting }
}

/**
 * Hook for config import functionality.
 */
export function useConfigImport() {
  const replaceConfig = useSetAtom(replaceConfigAtom)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file)
      return

    setImporting(true)
    try {
      const result = await importConfigFromFile(file)
      setPreview(result)

      if (result.success) {
        const applyResult = await replaceConfig(result.config)
        if (applyResult.success) {
          toast.success('Configuration imported successfully')
          if (result.warnings.length > 0) {
            result.warnings.forEach(w => toast.warning(w))
          }
        }
        else {
          toast.error(applyResult.error.message)
        }
      }
      else {
        toast.error(result.error)
      }
    }
    catch {
      toast.error('Failed to import configuration')
    }
    finally {
      setImporting(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [replaceConfig])

  return {
    openFilePicker,
    handleFileSelect,
    fileInputRef,
    importing,
    preview,
    setPreview,
  }
}
