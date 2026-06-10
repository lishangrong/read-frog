import { useAtomValue, useSetAtom } from 'jotai'
import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { configAtom, configFields, resetConfigAtom, writeConfigAtom } from '@/utils/atoms/config'
import { exportConfigToFile } from '@/utils/config/config-export'
import { type ImportMode, mergeImportedConfig, parseAndValidateImportFile } from '@/utils/config/config-import'
import { ConfigCard } from '../../components/config-card'

export function ImportExport() {
  return (
    <div className="space-y-0 [&>*]:border-b [&>*:last-child]:border-b-0">
      <ExportSection />
      <ImportSection />
      <ResetSection />
    </div>
  )
}

function ExportSection() {
  const config = useAtomValue(configAtom)
  const [includeAPIKeys, setIncludeAPIKeys] = useState(false)

  function handleExport() {
    exportConfigToFile(config, { includeAPIKeys })
  }

  return (
    <ConfigCard
      title={i18n.t('options.settings.export.title')}
      description={i18n.t('options.settings.export.description')}
    >
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-api-keys"
            checked={includeAPIKeys}
            onCheckedChange={checked => setIncludeAPIKeys(checked === true)}
          />
          <label
            htmlFor="include-api-keys"
            className="text-sm leading-none font-medium"
          >
            {i18n.t('options.settings.export.includeAPIKeys')}
          </label>
        </div>
        <button
          type="button"
          className={cn(
            'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
            'hover:bg-primary/90',
          )}
          onClick={handleExport}
        >
          {i18n.t('options.settings.export.button')}
        </button>
      </div>
    </ConfigCard>
  )
}

function ImportSection() {
  const config = useAtomValue(configAtom)
  const setWriteConfig = useSetAtom(writeConfigAtom)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('overwrite')
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingConfig, setPendingConfig] = useState<typeof config | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await parseAndValidateImportFile(file)
    if (!result.success) {
      setImportError(result.error)
      setImportDialogOpen(true)
      setPendingConfig(null)
    }
    else {
      setPendingConfig(result.config)
      setImportError(null)
      setImportDialogOpen(true)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleImportConfirm() {
    if (!pendingConfig) return

    if (importMode === 'overwrite') {
      await setWriteConfig(pendingConfig)
    }
    else {
      const merged = mergeImportedConfig(config, pendingConfig)
      await setWriteConfig(merged)
    }

    setImportDialogOpen(false)
    setPendingConfig(null)
  }

  return (
    <ConfigCard
      title={i18n.t('options.settings.import.title')}
      description={i18n.t('options.settings.import.description')}
    >
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          className={cn(
            'rounded-md border px-4 py-2 text-sm font-medium',
            'hover:bg-accent',
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {i18n.t('options.settings.import.button')}
        </button>
      </div>

      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {importError
                ? i18n.t('options.settings.import.errorTitle')
                : i18n.t('options.settings.import.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {importError || i18n.t('options.settings.import.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!importError && (
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'overwrite'}
                  onChange={() => setImportMode('overwrite')}
                  className="accent-primary"
                />
                <span className="text-sm">{i18n.t('options.settings.import.overwrite')}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="accent-primary"
                />
                <span className="text-sm">{i18n.t('options.settings.import.merge')}</span>
              </label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>{i18n.t('options.settings.import.cancel')}</AlertDialogCancel>
            {!importError && (
              <AlertDialogAction onClick={handleImportConfirm}>
                {i18n.t('options.settings.import.confirm')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfigCard>
  )
}

function ResetSection() {
  const resetConfig = useSetAtom(resetConfigAtom)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleReset() {
    await resetConfig()
    setDialogOpen(false)
  }

  return (
    <ConfigCard
      title={i18n.t('options.settings.reset.title')}
      description={i18n.t('options.settings.reset.description')}
    >
      <div>
        <button
          type="button"
          className={cn(
            'rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive',
            'hover:bg-destructive/10',
          )}
          onClick={() => setDialogOpen(true)}
        >
          {i18n.t('options.settings.reset.button')}
        </button>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n.t('options.settings.reset.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.t('options.settings.reset.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{i18n.t('options.settings.reset.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              {i18n.t('options.settings.reset.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfigCard>
  )
}
