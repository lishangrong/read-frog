import type { Config } from '@/types/config/config'
import type { LangCodeISO6393 } from '@/types/config/languages'
import type { ProvidersConfig, ReadProviderNames, TranslateProviderNames } from '@/types/config/provider'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAtom, useSetAtom } from 'jotai'
import { configFields } from '@/utils/atoms/config'
import { completeOnboardingAtom } from '@/utils/atoms/onboarding'
import { DEFAULT_CONFIG } from '@/utils/constants/config'
import { OnboardingLayout } from './onboarding-layout'
import { StepApiKey } from './step-api-key'
import { StepLanguage } from './step-language'
import { StepRead } from './step-read'
import { StepTranslate } from './step-translate'

const TOTAL_STEPS = 4

export function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  const [languageConfig, setLanguageConfig] = useAtom(configFields.language)
  const [providersConfig, setProvidersConfig] = useAtom(configFields.providersConfig)
  const [translateConfig, setTranslateConfig] = useAtom(configFields.translate)
  const [readConfig, setReadConfig] = useAtom(configFields.read)
  const completeOnboarding = useSetAtom(completeOnboardingAtom)

  const [targetCode, setTargetCode] = useState<LangCodeISO6393>(
    languageConfig.targetCode ?? DEFAULT_CONFIG.language.targetCode,
  )
  const [localProvidersConfig, setLocalProvidersConfig] = useState<ProvidersConfig>(providersConfig)
  const [translateProvider, setTranslateProvider] = useState<TranslateProviderNames>(
    translateConfig.provider ?? DEFAULT_CONFIG.translate.provider,
  )
  const [readProvider, setReadProvider] = useState<ReadProviderNames>(
    readConfig.provider ?? DEFAULT_CONFIG.read.provider,
  )

  async function handleFinish() {
    await setLanguageConfig({ ...languageConfig, targetCode })
    await setProvidersConfig(localProvidersConfig)
    await setTranslateConfig({ ...translateConfig, provider: translateProvider })
    await setReadConfig({ ...readConfig, provider: readProvider })
    await completeOnboarding()
    navigate('/')
  }

  function handleNext() {
    if (currentStep === TOTAL_STEPS - 1) {
      handleFinish()
    }
    else {
      // Save current step's data before proceeding
      if (currentStep === 0) {
        setLanguageConfig({ ...languageConfig, targetCode })
      }
      else if (currentStep === 1) {
        setProvidersConfig(localProvidersConfig)
      }
      else if (currentStep === 2) {
        setTranslateConfig({ ...translateConfig, provider: translateProvider })
      }
      setCurrentStep(prev => prev + 1)
    }
  }

  function handlePrev() {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  async function handleSkip() {
    await completeOnboarding()
    navigate('/')
  }

  const steps: React.ReactNode[] = [
    <StepLanguage
      key="language"
      targetCode={targetCode}
      onTargetCodeChange={setTargetCode}
    />,
    <StepApiKey
      key="api-key"
      providersConfig={localProvidersConfig}
      onProvidersConfigChange={setLocalProvidersConfig}
    />,
    <StepTranslate
      key="translate"
      provider={translateProvider}
      onProviderChange={setTranslateProvider}
    />,
    <StepRead
      key="read"
      provider={readProvider}
      onProviderChange={setReadProvider}
    />,
  ]

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={handleSkip}
      canNext={true}
      isLastStep={currentStep === TOTAL_STEPS - 1}
    >
      {steps[currentStep]}
    </OnboardingLayout>
  )
}
