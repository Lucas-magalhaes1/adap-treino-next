'use client'

import { getAthleteGoals } from '@/actions/goals'
import {
  getAthleteTrainingModels,
  getFieldProgression,
  getFieldStatistics,
} from '@/actions/trainingAnalytics'
import { getTrainingModelById } from '@/actions/trainingModels'
import { ProgressionChart } from '@/components/analytics/ProgressionChart'
import {
  ArrowBack as ArrowBackIcon,
  TrendingDown,
  TrendingFlat,
  TrendingUp,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface AthleteAnalyticsScreenProps {
  athleteId: number
}

export function AthleteAnalyticsScreen({ athleteId }: AthleteAnalyticsScreenProps) {
  const router = useRouter()
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [periodDays, setPeriodDays] = useState(90)

  const { data: models } = useSWR(`athlete-${athleteId}-models`, () =>
    getAthleteTrainingModels(athleteId)
  )

  const { data: modelDetail } = useSWR(selectedModelId ? `model-${selectedModelId}` : null, () =>
    selectedModelId ? getTrainingModelById(selectedModelId) : null
  )

  // Auto-selecionar primeiro modelo
  useEffect(() => {
    if (models && models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id)
    }
  }, [models, selectedModelId])

  // Buscar campos numéricos do modelo
  const numericFields =
    modelDetail?.fields.filter((f) => f.fieldType === 'number' && f.parentId === null) || []

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />
      case 'down':
        return <TrendingDown color="error" />
      default:
        return <TrendingFlat color="action" />
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Análise de Progressão
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Seletores */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                select
                label="Modelo de Treino"
                value={selectedModelId || ''}
                onChange={(e) => setSelectedModelId(Number(e.target.value))}
                fullWidth
              >
                {models?.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name} - {model.sport.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Período"
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
                fullWidth
              >
                <MenuItem value={30}>Últimos 30 dias</MenuItem>
                <MenuItem value={90}>Últimos 3 meses</MenuItem>
                <MenuItem value={180}>Últimos 6 meses</MenuItem>
                <MenuItem value={365}>Último ano</MenuItem>
              </TextField>
            </Stack>
          </CardContent>
        </Card>

        {/* Estatísticas Resumidas */}
        {selectedModelId && numericFields.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Indicadores
            </Typography>
            <Stack spacing={2}>
              {numericFields.map((field) => (
                <FieldStatisticsCard
                  key={field.key}
                  athleteId={athleteId}
                  modelId={selectedModelId}
                  fieldKey={field.key}
                  fieldLabel={field.label}
                  fieldUnit={field.unit}
                  periodDays={periodDays}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Gráficos */}
        {selectedModelId && numericFields.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Gráficos de Evolução
            </Typography>
            <Stack spacing={2}>
              {numericFields.map((field) => (
                <FieldProgressionChart
                  key={field.key}
                  athleteId={athleteId}
                  modelId={selectedModelId}
                  fieldKey={field.key}
                  fieldLabel={field.label}
                  fieldUnit={field.unit}
                  periodDays={periodDays}
                />
              ))}
            </Stack>
          </Box>
        )}

        {(!selectedModelId || numericFields.length === 0) && (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                {!selectedModelId
                  ? 'Selecione um modelo de treino'
                  : 'Este modelo não possui campos numéricos para análise'}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

// Componente auxiliar para estatísticas de campo
function FieldStatisticsCard({
  athleteId,
  modelId,
  fieldKey,
  fieldLabel,
  fieldUnit,
  periodDays,
}: {
  athleteId: number
  modelId: number
  fieldKey: string
  fieldLabel: string
  fieldUnit?: string
  periodDays: number
}) {
  const { data: stats } = useSWR(`stats-${athleteId}-${modelId}-${fieldKey}-${periodDays}`, () =>
    getFieldStatistics(athleteId, modelId, fieldKey, fieldLabel, fieldUnit, periodDays)
  )

  if (!stats) return null

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {fieldLabel}
            </Typography>
            <Typography variant="h6">
              {stats.average.toFixed(2)} {fieldUnit}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Média • Min: {stats.min} • Máx: {stats.max}
            </Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5}>
            {stats.trend === 'up' && <TrendingUp color="success" />}
            {stats.trend === 'down' && <TrendingDown color="error" />}
            {stats.trend === 'stable' && <TrendingFlat color="action" />}
            <Chip
              label={`${stats.improvementPercentage > 0 ? '+' : ''}${stats.improvementPercentage.toFixed(1)}%`}
              size="small"
              color={
                stats.trend === 'up' ? 'success' : stats.trend === 'down' ? 'error' : 'default'
              }
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// Componente auxiliar para gráfico de progressão
function FieldProgressionChart({
  athleteId,
  modelId,
  fieldKey,
  fieldLabel,
  fieldUnit,
  periodDays,
}: {
  athleteId: number
  modelId: number
  fieldKey: string
  fieldLabel: string
  fieldUnit?: string
  periodDays: number
}) {
  const { data: progressionData } = useSWR(
    `progression-${athleteId}-${modelId}-${fieldKey}-${periodDays}`,
    () => getFieldProgression(athleteId, modelId, fieldKey, periodDays)
  )

  // Buscar metas do atleta relacionadas a este campo
  const { data: goals } = useSWR(`athlete-${athleteId}-goals`, () => getAthleteGoals(athleteId))

  if (!progressionData) return null

  // Encontrar meta ativa relacionada ao campo (comparar performanceMetric com fieldKey)
  const relatedGoal = goals?.find(
    (goal) =>
      goal.status === 'active' &&
      goal.performanceMetric &&
      (goal.performanceMetric.toLowerCase().includes(fieldKey.toLowerCase()) ||
        fieldKey.toLowerCase().includes(goal.performanceMetric.toLowerCase()) ||
        fieldLabel.toLowerCase().includes(goal.performanceMetric.toLowerCase()))
  )

  return (
    <ProgressionChart
      data={progressionData}
      fieldLabel={fieldLabel}
      unit={fieldUnit}
      goalValue={relatedGoal?.targetValue ? Number(relatedGoal.targetValue) : undefined}
      goalLabel={relatedGoal?.title}
    />
  )
}
