'use client'

import { getAthleteGoalsDashboard } from '@/actions/goals'
import { getPersonalRecords } from '@/actions/personalRecords'
import { getAllTrainings } from '@/actions/trainings'
import { useAthletes } from '@/hooks/useAthletes'
import {
  DirectionsRun as DirectionsRunIcon,
  FitnessCenter as FitnessCenterIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  TrendingUp,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { differenceInDays, endOfWeek, format, isThisWeek, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

export function DashboardScreen() {
  const router = useRouter()

  const { data: trainings } = useSWR('trainings', getAllTrainings)
  const { athletes } = useAthletes()

  const { data: allPersonalRecords } = useSWR('all-personal-records', async () => {
    if (!athletes) return []
    const records = await Promise.all(athletes.map((athlete) => getPersonalRecords(athlete.id)))
    return records.flat()
  })

  // Treinos desta semana
  const trainingsThisWeek = trainings?.filter((t) => isThisWeek(new Date(t.date), { locale: ptBR }))

  // Estatísticas gerais
  const totalTrainings = trainings?.length || 0
  const completedTrainings = trainings?.filter((t) => t.status === 'completed').length || 0
  const activeTrainings = trainings?.filter((t) => t.status === 'active').length || 0

  // Duração total dos treinos completados (em minutos)
  const totalDuration =
    trainings?.filter((t) => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) || 0
  const totalHours = Math.floor(totalDuration / 3600)

  // Recordes recentes (últimos 5)
  const recentRecords = allPersonalRecords
    ?.sort((a, b) => new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime())
    .slice(0, 5)

  // Próximos treinos da semana
  const weekStart = startOfWeek(new Date(), { locale: ptBR })
  const weekEnd = endOfWeek(new Date(), { locale: ptBR })

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      {/* Cards de Estatísticas Rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<PersonIcon />}
            label="Atletas"
            value={athletes?.length || 0}
            color="primary"
            onClick={() => router.push('/dashboard/athletes')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<FitnessCenterIcon />}
            label="Treinos Totais"
            value={totalTrainings}
            color="success"
            onClick={() => router.push('/dashboard/trainings')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<TrendingUp />}
            label="Treinos Completos"
            value={completedTrainings}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<TimelineIcon />}
            label="Horas Treinadas"
            value={`${totalHours}h`}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Treinos desta Semana */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              <DirectionsRunIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Treinos desta Semana
            </Typography>
            <Chip label={trainingsThisWeek?.length || 0} color="primary" size="small" />
          </Stack>

          {trainingsThisWeek && trainingsThisWeek.length > 0 ? (
            <List>
              {trainingsThisWeek.slice(0, 5).map((training) => (
                <ListItem
                  key={training.id}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderRadius: 1,
                  }}
                  onClick={() => router.push(`/dashboard/trainings/${training.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar src={training.athletePhoto || undefined}>
                      {training.athleteName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={training.athleteName}
                    secondary={`${training.modelName || 'Modelo desconhecido'} - ${format(new Date(training.date), 'EEE, dd/MM', { locale: ptBR })}`}
                  />
                  <Chip
                    label={training.status === 'active' ? 'Em andamento' : 'Finalizado'}
                    size="small"
                    color={training.status === 'active' ? 'warning' : 'success'}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" align="center">
              Nenhum treino esta semana
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Grid com 2 colunas */}
      <Grid container spacing={3}>
        {/* Metas Próximas do Prazo */}
        <Grid size={{ xs: 12, md: 6 }}>
          <GoalsNearDeadline athletes={athletes || []} />
        </Grid>

        {/* Recordes Recentes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">
                  <TrophyIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#FFD700' }} />
                  Recordes Recentes
                </Typography>
                <Chip label={recentRecords?.length || 0} color="warning" size="small" />
              </Stack>

              {recentRecords && recentRecords.length > 0 ? (
                <List>
                  {recentRecords.map((record) => {
                    const athlete = athletes?.find((a) => a.id === record.athleteId)
                    return (
                      <ListItem
                        key={record.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                        }}
                        onClick={() => router.push(`/dashboard/athletes/${record.athleteId}`)}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={athlete?.photo || undefined}
                            sx={{ bgcolor: 'warning.main' }}
                          >
                            <TrophyIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={record.title}
                          secondary={`${athlete?.name || 'Atleta'} • ${format(new Date(record.dateAchieved), 'dd/MMM', { locale: ptBR })}`}
                        />
                        <Typography variant="h6" color="primary">
                          {record.value} {record.unit}
                        </Typography>
                      </ListItem>
                    )
                  })}
                </List>
              ) : (
                <Typography color="text.secondary" align="center">
                  Nenhum recorde registrado
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

// Componente auxiliar para cards de estatísticas
function StatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'primary' | 'success' | 'info' | 'warning' | 'error'
  onClick?: () => void
}) {
  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-4px)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

// Componente para exibir metas próximas do prazo
function GoalsNearDeadline({ athletes }: { athletes: any[] }) {
  const router = useRouter()

  // Buscar metas de todos os atletas
  const { data: allGoals } = useSWR(
    athletes && athletes.length > 0 ? 'all-athlete-goals' : null,
    async () => {
      if (!athletes || athletes.length === 0) return []
      const goalsPromises = athletes.map((athlete: any) => getAthleteGoalsDashboard(athlete.id))
      const goalsArrays = await Promise.all(goalsPromises)
      return goalsArrays.flat()
    }
  )

  // Filtrar metas próximas do prazo (7 dias)
  const goalsNearDeadline = allGoals?.filter((goal: any) => {
    if (!goal.targetDate || goal.status !== 'active') return false
    const daysUntilDeadline = differenceInDays(new Date(goal.targetDate), new Date())
    return daysUntilDeadline >= 0 && daysUntilDeadline <= 7
  })

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">
            <TrophyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Metas Próximas do Prazo
          </Typography>
          <Chip label={goalsNearDeadline?.length || 0} color="warning" size="small" />
        </Stack>

        {goalsNearDeadline && goalsNearDeadline.length > 0 ? (
          <List>
            {goalsNearDeadline.slice(0, 5).map((goal: any) => {
              const daysLeft = differenceInDays(new Date(goal.targetDate!), new Date())
              const athlete = athletes?.find((a: any) => a.id === goal.athleteId)
              const progress =
                goal.currentValue && goal.targetValue
                  ? Math.min((Number(goal.currentValue) / Number(goal.targetValue)) * 100, 100)
                  : 0

              return (
                <Box key={goal.id} sx={{ mb: 2 }}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                    onClick={() => router.push(`/dashboard/athletes/${goal.athleteId}`)}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                      <Avatar src={athlete?.photo || undefined}>
                        {athlete?.name.charAt(0).toUpperCase() || 'A'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{goal.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {athlete?.name || 'Atleta'} • {goal.performanceMetric || 'Métrica'}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          daysLeft === 0 ? 'Hoje' : `${daysLeft} dia${daysLeft > 1 ? 's' : ''}`
                        }
                        size="small"
                        color={daysLeft <= 2 ? 'error' : 'warning'}
                      />
                    </Stack>

                    {goal.targetValue && (
                      <Box sx={{ width: '100%', pl: 7 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {goal.currentValue || 0} / {goal.targetValue}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(progress)}%
                          </Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={progress} />
                      </Box>
                    )}
                  </ListItem>
                </Box>
              )
            })}
          </List>
        ) : (
          <Typography color="text.secondary" align="center">
            Nenhuma meta próxima do prazo
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
