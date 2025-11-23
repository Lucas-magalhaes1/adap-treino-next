'use client'

import { deleteTraining, getTrainingById } from '@/actions/trainings'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { TrainingModelField } from '@/types/trainingModel'
import { exportTrainingToCSV, exportTrainingToPDF } from '@/utils/exportTraining'
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'

interface TrainingDetailsScreenProps {
  trainingId: number
}

export function TrainingDetailsScreen({ trainingId }: TrainingDetailsScreenProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null)

  const { data: training, isLoading } = useSWR(`training-${trainingId}`, () =>
    getTrainingById(trainingId)
  )

  const handleDelete = async () => {
    try {
      await deleteTraining(trainingId)
      router.push('/dashboard/trainings')
    } catch (error) {
      console.error('Erro ao deletar treino:', error)
    }
  }

  const handleEdit = () => {
    // Navegar para tela de edição (reutilizar ActiveTrainingScreen com modo edição)
    router.push(`/dashboard/trainings/${trainingId}/edit`)
  }

  const handleExportCSV = () => {
    if (training) {
      exportTrainingToCSV(training)
      setExportMenuAnchor(null)
    }
  }

  const handleExportPDF = () => {
    exportTrainingToPDF()
    setExportMenuAnchor(null)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}min ${secs}s`
    }
    return `${minutes}min ${secs}s`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const renderFieldValue = (field: TrainingModelField, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <Typography color="text.secondary">Não preenchido</Typography>
    }

    switch (field.fieldType) {
      case 'boolean':
        return <Typography>{value ? 'Sim' : 'Não'}</Typography>

      case 'number':
        return (
          <Typography>
            {value} {field.unit && field.unit}
          </Typography>
        )

      case 'choice':
        const option = field.config?.options?.find((opt) => opt.id === value)
        return <Typography>{option?.label || value}</Typography>

      case 'multiple-choice':
        if (!Array.isArray(value) || value.length === 0) {
          return <Typography color="text.secondary">Nenhuma opção selecionada</Typography>
        }
        const selectedOptions = field.config?.options?.filter((opt) => value.includes(opt.id))
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {selectedOptions?.map((opt) => (
              <Chip key={opt.id} label={opt.label} size="small" />
            ))}
          </Stack>
        )

      case 'expandable-boolean':
        const allFields = training?.data?.snapshot?.fields || []
        return (
          <Box>
            <Typography>{value ? 'Sim' : 'Não'}</Typography>
            {value && (
              <Box sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Campos condicionais preenchidos:
                </Typography>
                {renderNestedFields(field.id, allFields)}
              </Box>
            )}
          </Box>
        )

      case 'group':
        const allFieldsForGroup = training?.data?.snapshot?.fields || []
        return (
          <Box>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              📁 {field.label}
            </Typography>
            <Box sx={{ pl: 2 }}>{renderNestedFields(field.id, allFieldsForGroup)}</Box>
          </Box>
        )

      default:
        return <Typography>{String(value)}</Typography>
    }
  }

  const renderNestedFields = (parentId: string, allFields: TrainingModelField[]) => {
    const childFields = allFields
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    if (childFields.length === 0) {
      return (
        <Typography color="text.secondary" variant="caption">
          Nenhum campo aninhado
        </Typography>
      )
    }

    return childFields.map((childField) => (
      <Box key={childField.key} sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
          {childField.label}
        </Typography>
        {renderFieldValue(childField, training?.data?.values?.[childField.key])}
      </Box>
    ))
  }

  const renderFields = (fields: TrainingModelField[], formType: 'general' | 'athlete') => {
    const filteredFields = fields
      .filter((f) => f.formType === formType && f.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    if (filteredFields.length === 0) {
      return (
        <Typography color="text.secondary" variant="body2">
          Nenhum campo nesta seção
        </Typography>
      )
    }

    return filteredFields.map((field) => (
      <Box key={field.key} sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
          {field.label} {field.isRequired && '*'}
        </Typography>
        {renderFieldValue(field, training?.data?.values?.[field.key])}
      </Box>
    ))
  }

  if (isLoading || !training) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard/trainings')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Detalhes do Treino
          </Typography>
          <IconButton color="inherit" onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
            <DownloadIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleEdit}>
            <EditIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Menu de Exportação */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={handleExportCSV}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exportar CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportPDF}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exportar PDF (Imprimir)</ListItemText>
        </MenuItem>
      </Menu>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>
        {/* Card Resumo */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
              {training.participants.length === 1 ? (
                <>
                  <Avatar
                    src={training.participants[0].photo}
                    alt={training.participants[0].name}
                    sx={{ width: 56, height: 56 }}
                  >
                    {training.participants[0].name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{training.participants[0].name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(training.date)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{training.participants.length} atletas</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(training.date)}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {training.participants.slice(0, 5).map((participant) => (
                      <Avatar
                        key={participant.id}
                        src={participant.photo}
                        alt={participant.name}
                        sx={{ width: 32, height: 32 }}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </Avatar>
                    ))}
                    {training.participants.length > 5 && (
                      <Avatar sx={{ width: 32, height: 32 }}>
                        +{training.participants.length - 5}
                      </Avatar>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ mb: 2, alignItems: { xs: 'flex-start', sm: 'center' } }}
            >
              <Chip label={training.data.snapshot.modelName} size="small" color="primary" />
              <Chip label={training.data.snapshot.sportName} size="small" variant="outlined" />
            </Stack>

            {training.data.duration && (
              <Stack direction="row" spacing={1} alignItems="center">
                <TimerIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Duração: {formatDuration(training.data.duration)}
                </Typography>
              </Stack>
            )}

            {training.participants.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Outros Participantes
                </Typography>
                <Stack direction="row" spacing={1}>
                  {training.participants.map((participant) => (
                    <Chip
                      key={participant.id}
                      label={participant.name}
                      size="small"
                      avatar={
                        <Avatar src={participant.photo || undefined}>
                          {participant.name.charAt(0)}
                        </Avatar>
                      }
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Formulário Geral */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Formulário Geral
            </Typography>
            {renderFields(training.data.snapshot.fields, 'general')}
          </CardContent>
        </Card>

        {/* Formulário do Atleta */}
        {training.participants.map((participant) => {
          const athleteValues = training.data.athleteValues?.[participant.id] || {}
          const hasAthleteData =
            Object.keys(athleteValues).length > 0 ||
            training.data.snapshot.fields.some((f) => f.formType === 'athlete')

          if (!hasAthleteData) return null
          console.log({ athleteValues, training })
          return (
            <Card key={participant.id} sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar src={participant.photo || undefined} sx={{ width: 40, height: 40 }}>
                    {participant.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{participant.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Formulário do Atleta
                    </Typography>
                  </Box>
                </Stack>
                {training.data.snapshot.fields
                  .filter((f) => f.formType === 'athlete' && f.parentId === null)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((field) => {
                    // Buscar o valor do campo específico deste atleta
                    const fieldValue = athleteValues[field.key]

                    return (
                      <Box key={field.key} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {field.label} {field.isRequired && '*'}
                        </Typography>
                        {renderFieldValue(field, fieldValue)}
                      </Box>
                    )
                  })}
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Excluir Treino"
        message="Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  )
}
