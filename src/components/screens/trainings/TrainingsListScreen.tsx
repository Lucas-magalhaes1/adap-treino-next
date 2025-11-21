'use client'

import { getAllSports } from '@/actions/trainingModels'
import { getAllTrainings, getTrainingById } from '@/actions/trainings'
import { EmptyState } from '@/components/common/EmptyState'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import type { TrainingDetail, TrainingSummary } from '@/types/training'
import { exportMultipleTrainingsToCSV } from '@/utils/exportTraining'
import {
  Add as AddIcon,
  Close as CloseIcon,
  DirectionsRun as DirectionsRunIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { StartTrainingDialog } from './StartTrainingDialog'

export function TrainingsListScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Filtros
  const [filterSportId, setFilterSportId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')

  const { data: trainings, isLoading } = useSWR('trainings', getAllTrainings)
  const { data: sports } = useSWR('sports', getAllSports)

  // Agrupar treinos por data
  const groupedTrainings = trainings?.reduce(
    (acc, training) => {
      let dateLabel: string

      const trainingDate = new Date(training.date)

      if (isToday(trainingDate)) {
        dateLabel = 'Hoje'
      } else if (isYesterday(trainingDate)) {
        dateLabel = 'Ontem'
      } else {
        dateLabel = format(trainingDate, 'dd/MM/yyyy', { locale: ptBR })
      }

      if (!acc[dateLabel]) {
        acc[dateLabel] = []
      }

      acc[dateLabel].push(training)
      return acc
    },
    {} as Record<string, TrainingSummary[]>
  )

  const filteredGroupedTrainings = groupedTrainings
    ? Object.entries(groupedTrainings).reduce(
        (acc, [date, trainings]) => {
          const filtered = trainings.filter((t) => {
            // Filtro de busca
            const matchesSearch =
              t.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.modelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.sportName.toLowerCase().includes(searchQuery.toLowerCase())

            // Filtro de esporte
            const matchesSport =
              !filterSportId || t.sportName === sports?.find((s) => s.id === filterSportId)?.name

            // Filtro de status
            const matchesStatus =
              filterStatus === 'all' ||
              (filterStatus === 'active' && t.status === 'active') ||
              (filterStatus === 'completed' && t.status === 'completed')

            // Filtro de data
            const trainingDate = new Date(t.date)
            const matchesStartDate = !filterStartDate || trainingDate >= new Date(filterStartDate)
            const matchesEndDate = !filterEndDate || trainingDate <= new Date(filterEndDate)

            return (
              matchesSearch && matchesSport && matchesStatus && matchesStartDate && matchesEndDate
            )
          })

          if (filtered.length > 0) {
            acc[date] = filtered
          }

          return acc
        },
        {} as Record<string, TrainingSummary[]>
      )
    : {}

  const activeFiltersCount = [
    filterSportId !== null,
    filterStatus !== 'all',
    filterStartDate !== '',
    filterEndDate !== '',
  ].filter(Boolean).length

  const handleClearFilters = () => {
    setFilterSportId(null)
    setFilterStatus('all')
    setFilterStartDate('')
    setFilterEndDate('')
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const handleTrainingClick = (training: TrainingSummary) => {
    // Se o treino está ativo, vai para tela de treino ativo
    // Se está finalizado, vai para tela de detalhes
    if (training.status === 'active') {
      router.push(`/dashboard/trainings/${training.id}/active`)
    } else {
      router.push(`/dashboard/trainings/${training.id}`)
    }
  }

  const handleExportAll = async () => {
    if (!trainings || trainings.length === 0) return

    setIsExporting(true)
    try {
      // Buscar detalhes completos de todos os treinos
      const trainingDetails: TrainingDetail[] = []
      for (const summary of trainings) {
        const detail = await getTrainingById(summary.id)
        if (detail) trainingDetails.push(detail)
      }
      exportMultipleTrainingsToCSV(trainingDetails)
    } catch (error) {
      console.error('Erro ao exportar treinos:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header com busca */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            placeholder="Buscar treinos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
          />
          <IconButton onClick={handleExportAll} disabled={isExporting || !trainings?.length}>
            {isExporting ? <CircularProgress size={24} /> : <DownloadIcon />}
          </IconButton>
          <IconButton onClick={() => setFilterDialogOpen(true)}>
            <FilterListIcon />
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                color="primary"
                sx={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20 }}
              />
            )}
          </IconButton>
        </Stack>

        {/* Chips de filtros ativos */}
        {activeFiltersCount > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
            {filterSportId && (
              <Chip
                label={`Esporte: ${sports?.find((s) => s.id === filterSportId)?.name}`}
                size="small"
                onDelete={() => setFilterSportId(null)}
              />
            )}
            {filterStatus !== 'all' && (
              <Chip
                label={filterStatus === 'active' ? 'Em andamento' : 'Finalizados'}
                size="small"
                onDelete={() => setFilterStatus('all')}
              />
            )}
            {filterStartDate && (
              <Chip
                label={`Desde: ${format(new Date(filterStartDate), 'dd/MM/yyyy')}`}
                size="small"
                onDelete={() => setFilterStartDate('')}
              />
            )}
            {filterEndDate && (
              <Chip
                label={`Até: ${format(new Date(filterEndDate), 'dd/MM/yyyy')}`}
                size="small"
                onDelete={() => setFilterEndDate('')}
              />
            )}
            <Chip
              label="Limpar tudo"
              size="small"
              variant="outlined"
              onClick={handleClearFilters}
            />
          </Stack>
        )}
      </Box>

      {/* Timeline de Treinos */}
      {Object.keys(filteredGroupedTrainings).length === 0 ? (
        <EmptyState
          icon={<DirectionsRunIcon sx={{ fontSize: 64 }} />}
          title="Nenhum treino registrado"
          description="Inicie um novo treino para começar"
        />
      ) : (
        <Box sx={{ px: 2 }}>
          {Object.entries(filteredGroupedTrainings).map(([date, trainings]) => (
            <Box key={date} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {date}
              </Typography>

              <Stack spacing={1}>
                {trainings.map((training) => (
                  <Card
                    key={training.id}
                    onClick={() => handleTrainingClick(training)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        {/* Avatars do Treino (até 4) */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AvatarGroup max={4}>
                            {training.participants.map((p) => (
                              <Avatar
                                key={p.id}
                                src={p.photo}
                                alt={p.name}
                                sx={{ width: 40, height: 40 }}
                              >
                                {p.name.charAt(0).toUpperCase()}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </Box>

                        {/* Informações do Treino: título + participantes */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {`Treino ${training.name} ${training.modelName} ${training.id}` ||
                              `Treino #${training.id}`}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              {/* Mostrar até 3 nomes, senão truncar e mostrar +N */}
                              {(() => {
                                const maxNames = 3
                                const names = training.participants.map((p) => p.name)
                                const visible = names.slice(0, maxNames)
                                const rest = names.length - visible.length
                                return (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      width: '100%',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {visible.join(', ')}
                                    {rest > 0 ? `, +${rest}` : ''}
                                  </span>
                                )
                              })()}
                            </Box>
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                            <Chip
                              label={training.modelName || training.sportName}
                              size="small"
                              variant="outlined"
                            />
                            {training.status === 'active' && (
                              <Chip
                                label="Em andamento"
                                size="small"
                                color="success"
                                icon={<TimerIcon />}
                              />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(training.date), "HH:mm 'h'", { locale: ptBR })}
                            </Typography>

                            {training.duration && (
                              <Typography variant="caption" color="text.secondary">
                                <TimerIcon
                                  sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }}
                                />
                                {formatDuration(training.duration)}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      {/* FAB para iniciar novo treino */}
      <FloatingActionButton
        icon={<AddIcon />}
        label="Novo Treino"
        onClick={() => setStartDialogOpen(true)}
      />

      {/* Dialog para iniciar treino */}
      <StartTrainingDialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} />

      {/* Dialog de filtros */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Filtros Avançados
          <IconButton
            onClick={() => setFilterDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Filtro por Esporte */}
            <TextField
              select
              label="Esporte"
              value={filterSportId || ''}
              onChange={(e) => setFilterSportId(e.target.value ? Number(e.target.value) : null)}
              fullWidth
            >
              <MenuItem value="">Todos os esportes</MenuItem>
              {sports?.map((sport) => (
                <MenuItem key={sport.id} value={sport.id}>
                  {sport.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Filtro por Status */}
            <TextField
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              fullWidth
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Em andamento</MenuItem>
              <MenuItem value="completed">Finalizados</MenuItem>
            </TextField>

            {/* Filtro por Período */}
            <Typography variant="subtitle2">Período</Typography>
            <TextField
              label="Data Inicial"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Data Final"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters}>Limpar Filtros</Button>
          <Button onClick={() => setFilterDialogOpen(false)} variant="contained">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
