import type { ReadProviderNames } from '@/types/config/provider'
import ProviderIcon from '@/components/provider-icon'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { READ_PROVIDER_ITEMS } from '@/utils/constants/config'

interface StepReadProps {
  provider: ReadProviderNames
  onProviderChange: (provider: ReadProviderNames) => void
}

export function StepRead({ provider, onProviderChange }: StepReadProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{i18n.t('onboarding.read.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{i18n.t('onboarding.read.description')}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="read-provider" className="text-sm font-medium">
          {i18n.t('onboarding.read.provider')}
        </label>
        <Select
          value={provider}
          onValueChange={(value: ReadProviderNames) => onProviderChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(READ_PROVIDER_ITEMS).map(([value, { logo, name }]) => (
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
