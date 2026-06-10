import type { TranslateProviderNames } from '@/types/config/provider'
import ProviderIcon from '@/components/provider-icon'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LLM_TRANSLATE_PROVIDER_ITEMS, PURE_TRANSLATE_PROVIDER_ITEMS } from '@/utils/constants/config'

interface StepTranslateProps {
  provider: TranslateProviderNames
  onProviderChange: (provider: TranslateProviderNames) => void
}

export function StepTranslate({ provider, onProviderChange }: StepTranslateProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{i18n.t('onboarding.translate.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{i18n.t('onboarding.translate.description')}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="translate-provider" className="text-sm font-medium">
          {i18n.t('onboarding.translate.provider')}
        </label>
        <Select
          value={provider}
          onValueChange={(value: TranslateProviderNames) => onProviderChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{i18n.t('translateService.normalTranslator')}</SelectLabel>
              {Object.entries(PURE_TRANSLATE_PROVIDER_ITEMS).map(([value, { logo, name }]) => (
                <SelectItem key={value} value={value}>
                  <ProviderIcon logo={logo} name={name} />
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>{i18n.t('translateService.aiTranslator')}</SelectLabel>
              {Object.entries(LLM_TRANSLATE_PROVIDER_ITEMS).map(([value, { logo, name }]) => (
                <SelectItem key={value} value={value}>
                  <ProviderIcon logo={logo} name={name} />
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
