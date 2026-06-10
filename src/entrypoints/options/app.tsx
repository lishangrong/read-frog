import { OnboardingWizard } from '@/components/onboarding-wizard'
import { NAV_ITEMS } from './app-sidebar/nav-items'
import { Route, Routes } from 'react-router'
import { useCallback, useState } from 'react'

export default function App({ showOnboarding: initialShowOnboarding }: { showOnboarding?: boolean }) {
  const [showOnboarding, setShowOnboarding] = useState(initialShowOnboarding ?? false)

  const handleOnboardingComplete = useCallback(async () => {
    await storage.setItem<boolean>('local:__needsOnboarding', false)
    setShowOnboarding(false)
  }, [])

  if (showOnboarding) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </div>
    )
  }

  return (
    <Routes>
      {Object.entries(NAV_ITEMS).map(([key, item]) => (
        <Route key={key} path={item.url} element={<item.component />} />
      ))}
    </Routes>
  )
}
