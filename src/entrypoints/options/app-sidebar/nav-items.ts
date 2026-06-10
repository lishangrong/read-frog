import { Download, Globe, Key, Settings } from 'lucide-react'
import { ApiKeysPage } from '../pages/api-keys'
import { GeneralPage } from '../pages/general'
import { ImportExportPage } from '../pages/import-export'
import { TranslationPage } from '../pages/translation'

export const NAV_ITEMS = {
  '': {
    title: 'general',
    url: '/',
    icon: Settings,
    component: GeneralPage,
  },
  'api-keys': {
    title: 'apiKeys',
    url: '/api-keys',
    icon: Key,
    component: ApiKeysPage,
  },
  'translation': {
    title: 'translation',
    url: '/translation',
    icon: Globe,
    component: TranslationPage,
  },
  'import-export': {
    title: 'importExport',
    url: '/import-export',
    icon: Download,
    component: ImportExportPage,
  },
} as const satisfies Record<string, {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType
}>
