import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload, AlertTriangle, Check } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'

import { configAtom, replaceConfigAtom } from '@/utils/atoms/config'
import {
  downloadConfigFile,
  importConfigFromFile,
  type ImportResult,
} from '@/utils/config/import-export'
import { configFieldRegistry, getFieldKeys } from '@/utils/config/schema-registry'
import { PageLayout } from '../components/page-layout'
import { Checkbox } from '@/components/ui/checkbox'
import type { Config } from '@/types/config/config'

export function ImportExportPage() {
  return (
    <PageLayout title="Import / Export">
      <div className="flex flex-col gap-6 py-6">
        <ExportSection />
        <ImportSection />
      </div>
    </PageLayout>
  )
}

function ExportSection() {
  const config = useAtomValue(configAtom)
  const [selectedSections, setSelectedSections] = useState<Set<keyof Config>>(
    new Set(getFieldKeys()),
  )
  const [exporting, setExporting] = useState(false)

  const toggleSection = (key: keyof Config) => {
    setSelectedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      }
      else {
        next.add(key)
      }
      return next
    })
  }

  const selectAll = () => setSelectedSections(new Set(getFieldKeys()))
  const deselectAll = () => setSelectedSections(new Set())

  const handleExport = () => {
    setExporting(true)
    try {
      downloadConfigFile(config)
      toast.success('Configuration exported successfully')
    }
    catch {
      toast.error('Failed to export configuration')
    }
    finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Configuration
        </CardTitle>
        <CardDescription>
          Download your current configuration as a JSON file for backup or sync to another device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Sections to export</label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                None
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {getFieldKeys().map((key) => {
              const meta = configFieldRegistry[key]
              return (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded border hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedSections.has(key)}
                    onCheckedChange={() => toggleSection(key)}
                  />
                  <span className="text-sm">{meta.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        <Button onClick={handleExport} disabled={exporting || selectedSections.size === 0} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Configuration'}
        </Button>
      </CardContent>
    </Card>
  )
}

function ImportSection() {
  const replaceConfig = useSetAtom(replaceConfigAtom)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file)
      return

    setImporting(true)
    setImportResult(null)

    try {
      const result = await importConfigFromFile(file)
      setImportResult(result)

      if (result.success) {
        const applyResult = await replaceConfig(result.config)
        if (applyResult.success) {
          toast.success('Configuration imported successfully')
          result.warnings.forEach(w => toast.warning(w))
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Configuration
        </CardTitle>
        <CardDescription>
          Restore your configuration from a previously exported JSON file.
          This will overwrite your current settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {importing ? 'Importing...' : 'Choose Config File'}
        </Button>

        {/* Import result feedback */}
        {importResult && (
          <div className={`p-3 rounded-lg border text-sm ${
            importResult.success
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          >
            <div className="flex items-center gap-2">
              {importResult.success
                ? <Check className="w-4 h-4" />
                : <AlertTriangle className="w-4 h-4" />}
              {importResult.success
                ? 'Configuration imported successfully'
                : importResult.error}
            </div>
            {importResult.success && importResult.warnings.length > 0 && (
              <ul className="mt-2 ml-6 list-disc">
                {importResult.warnings.map(w => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
