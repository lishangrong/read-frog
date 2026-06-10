import type { APIProviderNames } from '@/types/config/provider'
import { readProviderNames, translateProviderNames } from '@/types/config/provider'
import {
  type OnboardingState,
  type OnboardingStep,
  advanceStep,
  createInitialOnboardingState,
  getLanguageDisplay,
  getOnboardingProgress,
  getRequiredAPIProviders,
  goBackStep,
  onboardingToConfigPatch,
} from '@/utils/config/onboarding'
import { langCodeISO6393Schema } from '@/types/config/languages'
import { writeConfigAtom } from '@/utils/atoms/config'
import { API_PROVIDER_ITEMS, TRANSLATE_PROVIDER_ITEMS, READ_PROVIDER_ITEMS } from '@/utils/constants/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Globe, Key, Languages, Sparkles } from 'lucide-react'

import { toast } from 'sonner'

const STEP_ICONS: Record<OnboardingStep, React.ComponentType<{ className?: string }>> = {
  welcome: Sparkles,
  language: Languages,
  'translate-provider': Globe,
  'read-provider': Globe,
  'api-key': Key,
  complete: Check,
}

const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  language: 'Language',
  'translate-provider': 'Translation',
  'read-provider': 'Reading',
  'api-key': 'API Keys',
  complete: 'Done',
}

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const writeConfig = useSetAtom(writeConfigAtom)
  const [state, setState] = useState<OnboardingState>(createInitialOnboardingState)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

  const progress = getOnboardingProgress(state)
  const isLastStep = state.step === 'complete'
  const isFirstStep = state.step === 'welcome'

  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Apply the config patch
      const patch = onboardingToConfigPatch(state)
      writeConfig(patch).then((result) => {
        if (result.success) {
          toast.success('Configuration saved!')
          onComplete()
        }
        else {
          toast.error(result.error.message)
        }
      })
      return
    }
    setState(advanceStep)
  }, [state, isLastStep, writeConfig, onComplete])

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      onComplete()
      return
    }
    setState(goBackStep)
  }, [isFirstStep, onComplete])

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto p-6 gap-6">
      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {STEP_LABELS[state.step]}
          </span>
          <span className="text-xs text-muted-foreground">
            Step
            {' '}
            {state.stepIndex + 1}
            {' '}
            of 6
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />

        {/* Step indicators */}
        <div className="flex justify-between mt-1">
          {Object.entries(STEP_LABELS).map(([step, label]) => {
            const stepKey = step as OnboardingStep
            const isActive = stepKey === state.step
            const isPast = (Object.keys(STEP_LABELS).indexOf(step) as number) < state.stepIndex
            const Icon = STEP_ICONS[stepKey]
            return (
              <div key={step} className="flex flex-col items-center gap-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isPast
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[300px] flex flex-col">
        {state.step === 'welcome' && <WelcomeStep />}
        {state.step === 'language' && (
          <LanguageStep state={state} setState={setState} />
        )}
        {state.step === 'translate-provider' && (
          <TranslateProviderStep state={state} setState={setState} />
        )}
        {state.step === 'read-provider' && (
          <ReadProviderStep state={state} setState={setState} />
        )}
        {state.step === 'api-key' && (
          <APIKeyStep
            state={state}
            setState={setState}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
          />
        )}
        {state.step === 'complete' && <CompleteStep state={state} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {isFirstStep ? 'Skip Setup' : 'Back'}
        </Button>
        <Button onClick={handleNext}>
          {isLastStep ? 'Finish Setup' : 'Next'}
          {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  )
}

// ─── Step Components ─────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Welcome to Read Frog</h2>
      <p className="text-muted-foreground max-w-md">
        Let's get you set up in just a few steps. We'll help you configure your
        language preferences, choose AI providers, and set up your API keys.
      </p>
      <p className="text-sm text-muted-foreground">
        You can always change these settings later in the Options page.
      </p>
    </div>
  )
}

function LanguageStep({
  state,
  setState,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
}) {
  // Popular languages shown prominently, rest available in full list
  const popularLangs = ['eng', 'cmn', 'jpn', 'kor', 'spa', 'fra', 'deu', 'por'] as const

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Language Settings</h3>
        <p className="text-sm text-muted-foreground">
          Choose the languages you want to read and translate to.
        </p>
      </div>

      {/* Source language */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Source Language</label>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:border-ring outline-none"
          value={state.sourceCode}
          onChange={e => setState(s => ({ ...s, sourceCode: e.target.value }))}
        >
          <option value="auto">Auto-detect</option>
          {langCodeISO6393Schema.options.map((code) => {
            const { enName, localName } = getLanguageDisplay(code)
            return (
              <option key={code} value={code}>
                {enName}
                {' '}
                ({localName}
                )
              </option>
            )
          })}
        </select>
      </div>

      {/* Target language */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Target Language (translate to)</label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {popularLangs.map((code) => {
            const { enName, localName } = getLanguageDisplay(code)
            const isSelected = state.targetCode === code
            return (
              <button
                type="button"
                key={code}
                className={`p-2 rounded-lg border text-sm text-center transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                }`}
                onClick={() => setState(s => ({ ...s, targetCode: code }))}
              >
                <div className="font-medium">{enName}</div>
                <div className="text-xs text-muted-foreground">{localName}</div>
              </button>
            )
          })}
        </div>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:border-ring outline-none"
          value={state.targetCode}
          onChange={e => setState(s => ({ ...s, targetCode: e.target.value }))}
        >
          {langCodeISO6393Schema.options.map((code) => {
            const { enName, localName } = getLanguageDisplay(code)
            return (
              <option key={code} value={code}>
                {enName}
                {' '}
                ({localName}
                )
              </option>
            )
          })}
        </select>
      </div>

      {/* Proficiency level */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Proficiency Level</label>
        <div className="grid grid-cols-3 gap-2">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
            const isSelected = state.level === level
            return (
              <button
                type="button"
                key={level}
                className={`p-3 rounded-lg border text-sm text-center transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                }`}
                onClick={() => setState(s => ({ ...s, level }))}
              >
                <div className="font-medium capitalize">{level}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {level === 'beginner' && 'Simple translations'}
                  {level === 'intermediate' && 'Balanced detail'}
                  {level === 'advanced' && 'In-depth analysis'}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TranslateProviderStep({
  state,
  setState,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
}) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Translation Provider</h3>
        <p className="text-sm text-muted-foreground">
          Choose which provider to use for translating web pages.
        </p>
      </div>

      {/* Free providers */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Free Providers (no API key needed)</label>
        <div className="grid grid-cols-2 gap-2">
          {(['microsoft', 'google'] as const).map((provider) => {
            const item = TRANSLATE_PROVIDER_ITEMS[provider]
            const isSelected = state.translateProvider === provider
            return (
              <button
                type="button"
                key={provider}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                }`}
                onClick={() => setState(s => ({ ...s, translateProvider: provider }))}
              >
                <img src={item.logo} alt={item.name} className="w-6 h-6 rounded-full border border-border bg-white p-0.5" />
                <div className="text-left">
                  <div className={`text-sm ${isSelected ? 'font-medium text-primary' : 'font-medium'}`}>{item.name}</div>
                  <div className="text-xs text-green-600">Free</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* LLM providers */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">AI Providers (API key required)</label>
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
          {translateProviderNames
            .filter(p => p !== 'microsoft' && p !== 'google')
            .map((provider) => {
              const item = TRANSLATE_PROVIDER_ITEMS[provider]
              const isSelected = state.translateProvider === provider
              return (
                <button
                  type="button"
                  key={provider}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                  onClick={() => setState(s => ({ ...s, translateProvider: provider }))}
                >
                  <img src={item.logo} alt={item.name} className="w-6 h-6 rounded-full border border-border bg-white p-0.5" />
                  <span className={`text-sm ${isSelected ? 'font-medium text-primary' : 'font-medium'}`}>{item.name}</span>
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function ReadProviderStep({
  state,
  setState,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
}) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Reading Provider</h3>
        <p className="text-sm text-muted-foreground">
          Choose which AI provider to use for advanced features like article analysis and explanations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
        {readProviderNames.map((provider) => {
          const item = READ_PROVIDER_ITEMS[provider]
          const isSelected = state.readProvider === provider
          return (
            <button
              type="button"
              key={provider}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted'
              }`}
              onClick={() => setState(s => ({ ...s, readProvider: provider }))}
            >
              <img src={item.logo} alt={item.name} className="w-6 h-6 rounded-full border border-border bg-white p-0.5" />
              <span className={`text-sm ${isSelected ? 'font-medium text-primary' : 'font-medium'}`}>{item.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function APIKeyStep({
  state,
  setState,
  showApiKey,
  setShowApiKey,
}: {
  state: OnboardingState
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>
  showApiKey: Record<string, boolean>
  setShowApiKey: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  const requiredProviders = getRequiredAPIProviders(state)

  if (requiredProviders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">No API Keys Needed!</h3>
        <p className="text-muted-foreground max-w-md">
          Your selected providers (
          {TRANSLATE_PROVIDER_ITEMS[state.translateProvider]?.name}
          {' '}
          for translation) don't require API keys. You're all set!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Enter API keys for your selected providers. You can find these in your provider's dashboard.
        </p>
      </div>

      {requiredProviders.map((provider) => {
        const item = API_PROVIDER_ITEMS[provider]
        const isVisible = showApiKey[provider] ?? false
        return (
          <div key={provider} className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <img src={item.logo} alt={item.name} className="w-5 h-5 rounded-full border border-border bg-white p-0.5" />
              {item.name}
            </label>
            <div className="flex gap-2">
              <Input
                type={isVisible ? 'text' : 'password'}
                placeholder={`Enter your ${item.name} API key`}
                value={state.apiKeys[provider] ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  setState(s => ({
                    ...s,
                    apiKeys: { ...s.apiKeys, [provider]: value },
                  }))
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(prev => ({ ...prev, [provider]: !prev[provider] }))}
              >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CompleteStep({ state }: { state: OnboardingState }) {
  const requiredProviders = getRequiredAPIProviders(state)
  const hasAllKeys = requiredProviders.every(p => state.apiKeys[p])

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Review Your Setup</h3>
        <p className="text-sm text-muted-foreground">
          Here's a summary of your configuration. Click "Finish Setup" to save.
        </p>
      </div>

      <div className="space-y-3">
        <SummaryRow
          icon={<Languages className="w-4 h-4" />}
          label="Languages"
          value={`${getLanguageDisplay(state.sourceCode === 'auto' ? state.targetCode : state.sourceCode).enName} → ${getLanguageDisplay(state.targetCode).enName}`}
          detail={`Level: ${state.level}`}
        />
        <SummaryRow
          icon={<Globe className="w-4 h-4" />}
          label="Translation"
          value={TRANSLATE_PROVIDER_ITEMS[state.translateProvider]?.name ?? state.translateProvider}
        />
        <SummaryRow
          icon={<Globe className="w-4 h-4" />}
          label="Reading"
          value={READ_PROVIDER_ITEMS[state.readProvider]?.name ?? state.readProvider}
        />
        {requiredProviders.length > 0 && (
          <SummaryRow
            icon={<Key className="w-4 h-4" />}
            label="API Keys"
            value={hasAllKeys ? `${requiredProviders.length} key(s) configured` : 'Some keys missing'}
            detail={requiredProviders.map(p => API_PROVIDER_ITEMS[p]?.name).join(', ')}
          />
        )}
      </div>
    </div>
  )
}

function SummaryRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
        {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
      </div>
    </div>
  )
}
