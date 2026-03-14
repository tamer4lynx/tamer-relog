import { useEffect } from '@lynx-js/react'
import { Outlet, useLocation } from 'react-router'
import { Screen, SafeArea, AppBar, Content, TabBar, AppShellProvider } from 'tamer-app-shell'
import { useSystemUI } from 'tamer-system-ui'

const TABS = [
  { icon: 'home', label: 'Home', path: '/' },
  { icon: 'info', label: 'About', path: '/about' },
  { icon: 'fit_screen', label: 'Insets', path: '/insets' },
  { icon: 'list', label: 'Screen', path: '/screen' },
] as const

export default function Layout() {
  const location = useLocation()
  const { setStatusBar, setNavigationBar } = useSystemUI()

  useEffect(() => {
    setStatusBar({ color: '#fff', style: 'light' })
    setNavigationBar({ color: '#fff', style: 'light' })
  }, [])
  const isTabRoute = TABS.some((t) => t.path === location.pathname)

  return (
    <Screen>
      <SafeArea edges={['top', 'left', 'right', 'bottom']}>
        <AppShellProvider showAppBar showTabBar={isTabRoute}>
          <AppBar title="Tamer4Lynx" style={{ backgroundColor: '#555' }} />
          <Content>
            <Outlet />
          </Content>
          {isTabRoute ? <TabBar tabs={[...TABS]} style={{ backgroundColor: '#555' }} /> : null}
        </AppShellProvider>
      </SafeArea>
    </Screen>
  )
}
