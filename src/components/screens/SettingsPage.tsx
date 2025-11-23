'use client'

import {
  Assessment,
  DarkMode,
  DirectionsRun,
  EmojiPeople,
  LightMode,
  Logout,
  Person,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Dialog,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useColorScheme,
} from '@mui/material'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { GoalsReportScreen } from './reports/GoalsReportScreen'
import { TrainingFrequencyReportScreen } from './reports/TrainingFrequencyReportScreen'
import { ManageAthleteGroupsScreen } from './settings/ManageAthleteGroupsScreen'
import { ManageSportsScreen } from './settings/ManageSportsScreen'
import ManageTrainingModelsScreen from './settings/ManageTrainingModelsScreen'
import TrainingModelEditor from './settings/TrainingModelEditor'

type SettingsView =
  | 'main'
  | 'sports'
  | 'models'
  | 'groups'
  | 'model-edit'
  | 'reports'
  | 'reports-goals'
  | 'reports-frequency'

export function SettingsPage() {
  const [currentView, setCurrentView] = useState<SettingsView>('main')
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const { mode, setMode } = useColorScheme()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleToggleTheme = () => {
    const modes = ['light', 'dark'] as const
    const currentIndex = modes.indexOf(mode as 'light' | 'dark')
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  const menuItems = [
    {
      id: 'profile' as const,
      icon: <Person fontSize="large" />,
      title: 'Meu Perfil',
      description: 'Editar informações pessoais',
      disabled: true,
    },
    {
      id: 'theme' as const,
      icon: mode === 'dark' ? <DarkMode fontSize="large" /> : <LightMode fontSize="large" />,
      title: 'Tema',
      description: mode === 'dark' ? 'Modo Escuro' : 'Modo Claro',
      onClick: handleToggleTheme,
    },
    {
      id: 'sports' as const,
      icon: <DirectionsRun fontSize="large" />,
      title: 'Gerenciar Esportes',
      description: 'Criar e editar esportes',
      onClick: () => setCurrentView('sports'),
    },
    {
      id: 'models' as const,
      icon: <SettingsIcon fontSize="large" />,
      title: 'Modelos de Treino',
      description: 'Configurar modelos',
      onClick: () => setCurrentView('models'),
    },
    {
      id: 'groups' as const,
      icon: <EmojiPeople fontSize="large" />,
      title: 'Grupos de Atletas',
      description: 'Organizar em grupos',
      onClick: () => setCurrentView('groups'),
    },
    {
      id: 'reports' as const,
      icon: <Assessment fontSize="large" />,
      title: 'Relatórios',
      description: 'Relatório de Metas',
      onClick: () => setCurrentView('reports'),
    },
  ]

  if (currentView !== 'main') {
    return (
      <Dialog fullScreen open onClose={() => setCurrentView('main')}>
        {currentView === 'models' ? (
          <ManageTrainingModelsScreen
            onBack={() => setCurrentView('main')}
            onSelectModel={(modelId) => {
              setSelectedModelId(modelId)
              setCurrentView('model-edit')
            }}
          />
        ) : currentView === 'model-edit' ? (
          <TrainingModelEditor
            modelId={selectedModelId}
            onBack={() => {
              setSelectedModelId(null)
              setCurrentView('models')
            }}
          />
        ) : (
          <>
            <AppBar position="relative" color="default" elevation={0}>
              <Toolbar>
                <IconButton edge="start" onClick={() => setCurrentView('main')}>
                  <Box component="span" sx={{ fontSize: 24 }}>
                    ←
                  </Box>
                </IconButton>
                <Typography variant="h6" sx={{ flex: 1, ml: 2 }}>
                  {currentView === 'sports' && 'Gerenciar Esportes'}
                  {currentView === 'groups' && 'Grupos de Atletas'}
                  {currentView === 'reports' && 'Relatórios'}
                  {currentView === 'reports-goals' && 'Relatório de Metas'}
                  {currentView === 'reports-frequency' && 'Frequência de Treinos'}
                </Typography>
              </Toolbar>
            </AppBar>
            <Box sx={{ p: 3, pb: 10 }}>
              {currentView === 'sports' && <ManageSportsScreen />}
              {currentView === 'groups' && <ManageAthleteGroupsScreen />}
              {currentView === 'reports' && (
                <Stack spacing={2}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardActionArea onClick={() => setCurrentView('reports-goals')} sx={{ p: 2 }}>
                      <CardContent sx={{ p: 0 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ color: 'text.secondary' }}>
                            <Assessment fontSize="large" />
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body1" fontWeight={600}>
                              Relatório de Metas
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Acompanhe o progresso das metas
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="text.secondary">
                            ›
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>

                  <Card sx={{ borderRadius: 3 }}>
                    <CardActionArea
                      onClick={() => setCurrentView('reports-frequency')}
                      sx={{ p: 2 }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ color: 'text.secondary' }}>
                            <DirectionsRun fontSize="large" />
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body1" fontWeight={600}>
                              Frequência de Treinos
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Análise de participação e alertas de evasão
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="text.secondary">
                            ›
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Stack>
              )}
              {currentView === 'reports-goals' && <GoalsReportScreen />}
              {currentView === 'reports-frequency' && <TrainingFrequencyReportScreen />}
            </Box>
          </>
        )}
      </Dialog>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Configurações
        </Typography>
      </Box>

      <Stack spacing={2}>
        {menuItems.map((item) => (
          <Card
            key={item.id}
            sx={{
              borderRadius: 3,
              opacity: item.disabled ? 0.6 : 1,
            }}
          >
            <CardActionArea onClick={item.onClick} disabled={item.disabled} sx={{ p: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: 'text.secondary' }}>{item.icon}</Box>
                  <Box flex={1}>
                    <Typography variant="body1" fontWeight={600}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    ›
                  </Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}

        <Card sx={{ borderRadius: 3 }}>
          <CardActionArea onClick={handleLogout} sx={{ p: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ color: 'error.main' }}>
                  <Logout fontSize="large" />
                </Box>
                <Box flex={1}>
                  <Typography variant="body1" fontWeight={600} color="error.main">
                    Sair
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      </Stack>
    </Container>
  )
}
