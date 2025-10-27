'use client'

import { FitnessCenter, MenuBook, People, Settings } from '@mui/icons-material'
import { BottomNavigation, BottomNavigationAction, Box, Paper } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'

interface NavBarProps {
  children?: React.ReactNode
}

export function MainLayout({ children }: NavBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Mapear rutas para índices
  const getValueFromPathname = () => {
    if (pathname.includes('/trainings')) return 0
    if (pathname.includes('/athletes')) return 1
    if (pathname.includes('/models')) return 2
    if (pathname.includes('/settings')) return 3
    return 0
  }

  const handleNavigation = (event: React.SyntheticEvent, newValue: number) => {
    const routes = [
      '/dashboard/trainings',
      '/dashboard/athletes',
      '/dashboard/models',
      '/dashboard/settings',
    ]
    router.push(routes[newValue])
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Conteúdo principal */}
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
          <BottomNavigationAction label="Treinos" icon={<FitnessCenter />} value={0} />
          <BottomNavigationAction label="Atletas" icon={<People />} value={1} />
          <BottomNavigationAction label="Modelos" icon={<MenuBook />} value={2} />
          <BottomNavigationAction label="Config" icon={<Settings />} value={3} />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
