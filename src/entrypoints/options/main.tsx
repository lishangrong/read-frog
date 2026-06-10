import type { Config } from '@/types/config/config'
import { Provider as JotaiProvider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import React from 'react'

import ReactDOM from 'react-dom/client'
import { HashRouter, Navigate, useLocation } from 'react-router'
import { configAtom } from '@/utils/atoms/config'
import { onboardingCompletedAtom } from '@/utils/atoms/onboarding'

import { useAtomValue } from 'jotai'
import { DEFAULT_CONFIG } from '@/utils/constants/config'
import App from './app'
import '@/assets/tailwind/theme.css'
import './style.css'

document.documentElement.classList.toggle(
  'dark',
  localStorage.theme === 'dark'
  || (!('theme' in localStorage)
    && window.matchMedia('(prefers-color-scheme: dark)').matches),
)

function HydrateAtoms({
  initialValues,
  children,
}: {
  initialValues: [[typeof configAtom, Config], [typeof onboardingCompletedAtom, boolean]]
  children: React.ReactNode
}) {
  useHydrateAtoms(initialValues)
  return children
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const onboardingCompleted = useAtomValue(onboardingCompletedAtom)
  const location = useLocation()

  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

async function initApp() {
  const root = document.getElementById('root')!
  root.className = 'antialiased bg-background'

  const [config, onboardingCompleted] = await Promise.all([
    storage.getItem<Config>('local:config'),
    storage.getItem<boolean>('local:onboardingCompleted'),
  ])

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <JotaiProvider>
        <HydrateAtoms initialValues={[
          [configAtom, config ?? DEFAULT_CONFIG],
          [onboardingCompletedAtom, onboardingCompleted ?? false],
        ]}
        >
          <HashRouter>
            <OnboardingGuard>
              <App />
            </OnboardingGuard>
          </HashRouter>
        </HydrateAtoms>
      </JotaiProvider>
    </React.StrictMode>,
  )
}

initApp()
