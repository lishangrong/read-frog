import { atom } from 'jotai'

const ONBOARDING_STORAGE_KEY = 'onboardingCompleted'

export const onboardingCompletedAtom = atom<boolean>(false)

onboardingCompletedAtom.onMount = (setAtom: (newValue: boolean) => void) => {
  storage.getItem<boolean>(`local:${ONBOARDING_STORAGE_KEY}`).then((value) => {
    setAtom(value ?? false)
  })
  const unwatch = storage.watch<boolean>(`local:${ONBOARDING_STORAGE_KEY}`, (newValue) => {
    if (newValue !== null) {
      setAtom(newValue)
    }
  })
  return unwatch
}

export const completeOnboardingAtom = atom(
  null,
  async (_get, set) => {
    set(onboardingCompletedAtom, true)
    await storage.setItem(`local:${ONBOARDING_STORAGE_KEY}`, true)
  },
)
