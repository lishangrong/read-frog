import { Outlet, Route, Routes } from 'react-router'

import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { NAV_ITEMS } from './app-sidebar/nav-items'
import { OnboardingPage } from './pages/onboarding'

function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<MainLayout />}>
        {Object.entries(NAV_ITEMS).map(([key, item]) => (
          <Route key={key} path={item.url} element={<item.component />} />
        ))}
      </Route>
    </Routes>
  )
}
