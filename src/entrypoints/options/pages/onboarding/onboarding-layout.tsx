import { Progress } from '@/components/ui/progress'

interface OnboardingLayoutProps {
  currentStep: number
  totalSteps: number
  children: React.ReactNode
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  canNext: boolean
  isLastStep: boolean
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  children,
  onNext,
  onPrev,
  onSkip,
  canNext,
  isLastStep,
}: OnboardingLayoutProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Read Frog</h1>
          <p className="text-sm text-muted-foreground">
            {i18n.t('onboarding.stepProgress', [String(currentStep + 1), String(totalSteps)])}
          </p>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {children}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={onSkip}
          >
            {i18n.t('onboarding.skip')}
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                className={cn(
                  'rounded-md border px-4 py-2 text-sm font-medium',
                  'hover:bg-accent',
                )}
                onClick={onPrev}
              >
                {i18n.t('onboarding.prev')}
              </button>
            )}
            <button
              type="button"
              className={cn(
                'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              disabled={!canNext}
              onClick={onNext}
            >
              {isLastStep ? i18n.t('onboarding.finish') : i18n.t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
