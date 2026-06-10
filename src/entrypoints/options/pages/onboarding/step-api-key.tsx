import type { APIProviderNames, ProvidersConfig } from '@/types/config/provider'
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { apiProviderNames } from '@/types/config/provider'
import { API_PROVIDER_ITEMS } from '@/utils/constants/config'

interface StepApiKeyProps {
  providersConfig: ProvidersConfig
  onProvidersConfigChange: (config: ProvidersConfig) => void
}

export function StepApiKey({ providersConfig, onProvidersConfigChange }: StepApiKeyProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{i18n.t('onboarding.apiKey.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{i18n.t('onboarding.apiKey.description')}</p>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {apiProviderNames.map(provider => (
          <ProviderKeyInput
            key={provider}
            provider={provider}
            apiKey={providersConfig[provider]?.apiKey ?? ''}
            onChange={(apiKey) => {
              onProvidersConfigChange({
                ...providersConfig,
                [provider]: {
                  ...providersConfig[provider],
                  apiKey,
                },
              })
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ProviderKeyInput({
  provider,
  apiKey,
  onChange,
}: {
  provider: APIProviderNames
  apiKey: string
  onChange: (apiKey: string) => void
}) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <img
          src={API_PROVIDER_ITEMS[provider].logo}
          alt={API_PROVIDER_ITEMS[provider].name}
          className="border-border size-5 p-[3px] rounded-full border bg-white"
        />
        <span className="text-sm font-medium">{API_PROVIDER_ITEMS[provider].name}</span>
      </div>
      <Input
        placeholder="API Key"
        value={apiKey}
        type={showKey ? 'text' : 'password'}
        onChange={e => onChange(e.target.value)}
      />
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`onboarding-show-${provider}`}
          checked={showKey}
          onCheckedChange={checked => setShowKey(checked === true)}
        />
        <label
          htmlFor={`onboarding-show-${provider}`}
          className="text-xs leading-none font-medium"
        >
          {i18n.t('options.apiKeys.apiKey.showAPIKey')}
        </label>
      </div>
    </div>
  )
}
