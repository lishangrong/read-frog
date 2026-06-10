import { PageLayout } from '../../components/page-layout'
import { ImportExport } from './import-export'

export function SettingsPage() {
  return (
    <PageLayout title={i18n.t('options.settings.title')}>
      <ImportExport />
    </PageLayout>
  )
}
