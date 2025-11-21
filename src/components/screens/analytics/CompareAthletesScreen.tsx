'use client'

import { getAthleteTrainingModels, getFieldProgression } from '@/actions/trainingAnalytics'
import { ProgressionChart } from '@/components/analytics/ProgressionChart'
import { useAthletes } from '@/hooks/useAthletes'
import { ArrowBack as ArrowBackIcon, CompareArrows } from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'

export function CompareAthletesScreen() {
  const router = useRouter()
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<number[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('')
  const [periodDays, setPeriodDays] = useState(90)

  const { athletes } = useAthletes()

  // Buscar modelos do primeiro atleta selecionado
  const { data: models } = useSWR(
    selectedAthleteIds.length > 0 ? `athlete-${selectedAthleteIds[0]}-models` : null,
    () => (selectedAthleteIds[0] ? getAthleteTrainingModels(selectedAthleteIds[0]) : null)
  )

  const toggleAthlete = (athleteId: number) => {
    setSelectedAthleteIds((prev) => {
      if (prev.includes(athleteId)) {
        return prev.filter((id) => id !== athleteId)
      }
      if (prev.length >= 4) {
        // Limitar a 4 atletas
        return prev
      }
      return [...prev, athleteId]
    })
  }

  // Buscar campos do modelo selecionado
  const selectedModel = models?.find((m) => m.id === selectedModelId)

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Comparar Atletas
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Seleção de Atletas */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <CompareArrows color="primary" />
              <Typography variant="h6">Selecione os atletas (até 4)</Typography>
              <Chip label={`${selectedAthleteIds.length} selecionados`} size="small" />
            </Stack>

            <List>
              {athletes?.map((athlete) => (
                <ListItemButton
                  key={athlete.id}
                  onClick={() => toggleAthlete(athlete.id)}
                  disabled={
                    !selectedAthleteIds.includes(athlete.id) && selectedAthleteIds.length >= 4
                  }
                >
                  <Checkbox
                    edge="start"
                    checked={selectedAthleteIds.includes(athlete.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemAvatar>
                    <Avatar src={athlete.photo || undefined} alt={athlete.name}>
                      {athlete.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={athlete.name} />
                </ListItemButton>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Filtros */}
        {selectedAthleteIds.length >= 2 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Modelo de Treino"
                  value={selectedModelId || ''}
                  onChange={(e) => {
                    setSelectedModelId(Number(e.target.value))
                    setSelectedFieldKey('')
                  }}
                  fullWidth
                >
                  <MenuItem value="">Selecione um modelo</MenuItem>
                  {models?.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name} - {model.sport.name}
                    </MenuItem>
                  ))}
                </TextField>

                {selectedModelId && (
                  <TextField
                    select
                    label="Campo para Comparar"
                    value={selectedFieldKey}
                    onChange={(e) => setSelectedFieldKey(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="">Selecione um campo</MenuItem>
                    {selectedModel &&
                      'fields' in selectedModel &&
                      (selectedModel as any).fields
                        ?.filter((f: any) => f.fieldType === 'number')
                        .map((field: any) => (
                          <MenuItem key={field.key} value={field.key}>
                            {field.label} {field.unit && `(${field.unit})`}
                          </MenuItem>
                        ))}
                  </TextField>
                )}

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
        )}

        {/* Gráficos de Comparação */}
        {selectedAthleteIds.length >= 2 && selectedModelId && selectedFieldKey && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Comparação de Desempenho
            </Typography>

            {/* Grid com gráficos individuais */}
            <Grid container spacing={2}>
              {selectedAthleteIds.map((athleteId) => {
                const athlete = athletes?.find((a) => a.id === athleteId)
                return (
                  <Grid
                    size={{ xs: 12, md: selectedAthleteIds.length === 2 ? 6 : 12 }}
                    key={athleteId}
                  >
                    <AthleteComparisonChart
                      athleteId={athleteId}
                      athleteName={athlete?.name || 'Atleta'}
                      athletePhoto={athlete?.photo || undefined}
                      modelId={selectedModelId}
                      fieldKey={selectedFieldKey}
                      fieldLabel={
                        (selectedModel as any)?.fields?.find((f: any) => f.key === selectedFieldKey)
                          ?.label || selectedFieldKey
                      }
                      fieldUnit={
                        (selectedModel as any)?.fields?.find((f: any) => f.key === selectedFieldKey)
                          ?.unit
                      }
                      periodDays={periodDays}
                    />
                  </Grid>
                )
              })}
            </Grid>

            {/* Gráfico Combinado */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Comparação Sobreposta
                </Typography>
                <CombinedComparisonChart
                  athleteIds={selectedAthleteIds}
                  athletes={athletes || []}
                  modelId={selectedModelId}
                  fieldKey={selectedFieldKey}
                  fieldLabel={
                    (selectedModel as any)?.fields?.find((f: any) => f.key === selectedFieldKey)
                      ?.label || selectedFieldKey
                  }
                  fieldUnit={
                    (selectedModel as any)?.fields?.find((f: any) => f.key === selectedFieldKey)
                      ?.unit
                  }
                  periodDays={periodDays}
                />
              </CardContent>
            </Card>
          </Box>
        )}

        {selectedAthleteIds.length < 2 && (
          <Card>
            <CardContent>
              <Typography color="text.secondary" align="center">
                Selecione pelo menos 2 atletas para comparar
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

// Componente para gráfico individual de atleta
function AthleteComparisonChart({
  athleteId,
  athleteName,
  athletePhoto,
  modelId,
  fieldKey,
  fieldLabel,
  fieldUnit,
  periodDays,
}: {
  athleteId: number
  athleteName: string
  athletePhoto?: string
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

  const average =
    progressionData && progressionData.length > 0
      ? progressionData.reduce((sum, d) => sum + d.value, 0) / progressionData.length
      : 0

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar src={athletePhoto} alt={athleteName}>
            {athleteName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{athleteName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Média: {average.toFixed(2)} {fieldUnit}
            </Typography>
          </Box>
        </Stack>
        {progressionData && (
          <ProgressionChart data={progressionData} fieldLabel={fieldLabel} unit={fieldUnit} />
        )}
      </CardContent>
    </Card>
  )
}

// Componente para gráfico combinado
function CombinedComparisonChart({
  athleteIds,
  athletes,
  modelId,
  fieldKey,
  fieldLabel,
  fieldUnit,
  periodDays,
}: {
  athleteIds: number[]
  athletes: any[]
  modelId: number
  fieldKey: string
  fieldLabel: string
  fieldUnit?: string
  periodDays: number
}) {
  const colors = ['#1976d2', '#dc004e', '#388e3c', '#f57c00']

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Todos os atletas no mesmo gráfico
      </Typography>
      {/* Legenda */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {athleteIds.map((athleteId, index) => {
          const athlete = athletes.find((a) => a.id === athleteId)
          return (
            <Chip
              key={athleteId}
              avatar={<Avatar src={athlete?.photo || undefined}>{athlete?.name?.charAt(0)}</Avatar>}
              label={athlete?.name}
              size="small"
              sx={{
                borderLeft: `4px solid ${colors[index]}`,
              }}
            />
          )
        })}
      </Stack>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
        Gráfico combinado (implementar com recharts usando múltiplas linhas)
      </Typography>
    </Box>
  )
}
