'use client'

import { FitnessCenter, People, Settings } from '@mui/icons-material'
import { BottomNavigation, BottomNavigationAction, Box, LinearProgress, Paper } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'

interface NavBarProps {
  children?: React.ReactNode
}

export function MainLayout({ children }: NavBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  const routes = ['/dashboard/trainings', '/dashboard/athletes', '/dashboard/settings']

  useEffect(() => {
    // Prefetch the main routes in background so navigation is faster
    routes.forEach((r) => {
      router.prefetch(r)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getValueFromPathname = () => {
    if (pathname?.includes('/trainings')) return 0
    if (pathname?.includes('/athletes')) return 1
    if (pathname?.includes('/settings')) return 2
    return 0
  }

  const handleNavigation = (event: React.SyntheticEvent, newValue: number) => {
    const route = routes[newValue]
    setIsNavigating(true)
    startTransition(() => {
      router.push(route)
      setIsNavigating(false)
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isNavigating && (
        <LinearProgress
          color="primary"
          sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}
        />
      )}

      <Box sx={{ flex: 1, pb: 7 }}>{children}</Box>

      {/* Barra de navegação fixa */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          value={getValueFromPathname()}
          onChange={handleNavigation}
          showLabels
          sx={{
            '.MuiBottomNavigationAction-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Treinos"
            icon={<FitnessCenter />}
            value={0}
            disabled={isNavigating}
            onMouseEnter={() => Promise.resolve(router.prefetch(routes[0])).catch(() => {})}
          />
          <BottomNavigationAction
            label="Atletas"
            icon={<People />}
            value={1}
            disabled={isNavigating}
            onMouseEnter={() => Promise.resolve(router.prefetch(routes[1])).catch(() => {})}
          />
          <BottomNavigationAction
            label="Config"
            icon={<Settings />}
            value={2}
            disabled={isNavigating}
            onMouseEnter={() => Promise.resolve(router.prefetch(routes[2])).catch(() => {})}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
