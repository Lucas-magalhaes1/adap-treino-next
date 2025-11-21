'use client'

import {
  checkPersonalRecords,
  savePersonalRecord,
  type PersonalRecordCheck,
} from '@/actions/notifications'
import { finishTraining, getTrainingById, updateTrainingData } from '@/actions/trainings'
import { FinishTrainingDialog } from '@/components/common/FinishTrainingDialog'
import { LoadingButton } from '@/components/common/LoadingButton'
import { RecordNotification } from '@/components/common/RecordNotification'
import { useStopwatch } from '@/hooks/useStopwatch'
import type { TrainingModelField } from '@/types/trainingModel'
import {
  ArrowBack as ArrowBackIcon,
  Folder as FolderIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface ActiveTrainingScreenProps {
  trainingId: number
}

export function ActiveTrainingScreen({ trainingId }: ActiveTrainingScreenProps) {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<'general' | 'athlete'>('general')
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [athleteFormValues, setAthleteFormValues] = useState<Record<number, Record<string, any>>>(
    {}
  )
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [recordNotification, setRecordNotification] = useState<PersonalRecordCheck | null>(null)

  const { data: training, isLoading } = useSWR(
    `training-${trainingId}`,
    () => getTrainingById(trainingId),
    {
      refreshInterval: 0, // Não atualizar automaticamente
    }
  )

  const { formattedTime } = useStopwatch(training?.data?.startTime)

  // Carregar valores salvos
  useEffect(() => {
    if (training?.data?.values) {
      setFormValues(training.data.values)
    }
    if (training?.data?.athleteValues) {
      setAthleteFormValues(training.data.athleteValues)
    }
    if (training?.notes) {
      setNotes(training.notes)
    }
    // Selecionar primeiro atleta por padrão
    if (training?.participants && training.participants.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(training.participants[0].id)
    }
  }, [training, selectedAthleteId])

  const handleFieldChange = (key: string, value: any) => {
    if (currentTab === 'general') {
      setFormValues((prev) => ({
        ...prev,
        [key]: value,
      }))
    } else if (currentTab === 'athlete' && selectedAthleteId) {
      setAthleteFormValues((prev) => ({
        ...prev,
        [selectedAthleteId]: {
          ...(prev[selectedAthleteId] || {}),
          [key]: value,
        },
      }))
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateTrainingData(trainingId, formValues, notes, athleteFormValues)
    } catch (error) {
      console.error('Erro ao salvar treino:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinish = async (
    customStartTime: Date,
    customEndTime: Date,
    customDuration: number
  ) => {
    if (!training) return

    try {
      setIsSaving(true)

      // Usar o primeiro participante para verificar recordes
      const firstParticipant = training.participants[0]
      if (!firstParticipant) {
        throw new Error('Treino sem participantes')
      }

      // Verificar recordes pessoais antes de finalizar
      const recordChecks = await checkPersonalRecords(
        firstParticipant.id,
        training.data.snapshot.modelId,
        formValues,
        training.data.snapshot.fields
      )

      // Finalizar treino com tempo customizado
      await finishTraining(
        trainingId,
        formValues,
        notes,
        customDuration,
        customStartTime,
        customEndTime,
        athleteFormValues
      )

      // Salvar recordes e exibir notificações
      const newRecords = recordChecks.filter((r) => r.isNewRecord)

      if (newRecords.length > 0) {
        // Salvar primeiro recorde na tabela PersonalRecord
        const firstRecord = newRecords[0]
        await savePersonalRecord(
          firstParticipant.id,
          `${firstRecord.fieldLabel} - ${training.data.snapshot.modelName}`,
          firstRecord.newValue,
          firstRecord.unit,
          trainingId
        )

        // Exibir notificação do primeiro recorde
        setRecordNotification(firstRecord)

        // Se houver múltiplos recordes, exibi-los sequencialmente
        if (newRecords.length > 1) {
          for (let i = 1; i < newRecords.length; i++) {
            setTimeout(() => {
              const record = newRecords[i]
              savePersonalRecord(
                firstParticipant.id,
                `${record.fieldLabel} - ${training.data.snapshot.modelName}`,
                record.newValue,
                record.unit,
                trainingId
              )
              setRecordNotification(record)
            }, i * 5000) // 5 segundos entre cada notificação
          }
        }
      }

      // Redirecionar após 2 segundos (tempo para ver a notificação)
      setTimeout(() => {
        router.push(`/dashboard/trainings/${trainingId}`)
      }, 2000)
    } catch (error) {
      console.error('Erro ao finalizar treino:', error)
    } finally {
      setIsSaving(false)
      setFinishDialogOpen(false)
    }
  }

  const renderField = (field: TrainingModelField) => {
    // Para campos do atleta, usar os valores do atleta selecionado
    const value =
      currentTab === 'athlete' && selectedAthleteId
        ? athleteFormValues[selectedAthleteId]?.[field.key]
        : formValues[field.key]

    switch (field.fieldType) {
      case 'text':
        return (
          <TextField
            key={field.key}
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            required={field.isRequired}
            fullWidth
            sx={{ mb: 2 }}
          />
        )

      case 'number':
        return (
          <TextField
            key={field.key}
            label={field.label}
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
            required={field.isRequired}
            fullWidth
            InputProps={{
              endAdornment: field.unit ? (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {field.unit}
                </Typography>
              ) : undefined,
            }}
            inputProps={{
              min: field.config?.min,
              max: field.config?.max,
            }}
            sx={{ mb: 2 }}
          />
        )

      case 'boolean':
        return (
          <FormControlLabel
            key={field.key}
            control={
              <Checkbox
                checked={value || false}
                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
              />
            }
            label={field.label}
            sx={{ mb: 2 }}
          />
        )

      case 'choice':
        return (
          <Box key={field.key} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {field.label} {field.isRequired && '*'}
            </Typography>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            >
              {field.config?.options?.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </Box>
        )

      case 'multiple-choice':
        return (
          <Box key={field.key} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {field.label} {field.isRequired && '*'}
            </Typography>
            <FormGroup>
              {field.config?.options?.map((option) => (
                <FormControlLabel
                  key={option.id}
                  control={
                    <Checkbox
                      checked={value?.includes(option.id) || false}
                      onChange={(e) => {
                        const currentValue = value || []
                        const newValue = e.target.checked
                          ? [...currentValue, option.id]
                          : currentValue.filter((id: string) => id !== option.id)
                        handleFieldChange(field.key, newValue)
                      }}
                    />
                  }
                  label={option.label}
                />
              ))}
            </FormGroup>
          </Box>
        )

      case 'expandable-boolean':
        const boolValue = value ?? false
        const childFieldsForBoolean = training?.data?.snapshot?.fields
          ?.filter((f) => f.parentId === field.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)

        return (
          <Card key={field.key} sx={{ mb: 2 }}>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={boolValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                  />
                }
                label={field.label}
              />

              {/* Mostrar campos filhos apenas se o valor for true */}
              {boolValue && childFieldsForBoolean && childFieldsForBoolean.length > 0 && (
                <Box sx={{ ml: 4, mt: 2, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Campos condicionais:
                  </Typography>
                  {childFieldsForBoolean.map((childField) => renderField(childField))}
                </Box>
              )}
            </CardContent>
          </Card>
        )

      case 'group':
        const childFieldsForGroup = training?.data?.snapshot?.fields
          ?.filter((f) => f.parentId === field.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)

        return (
          <Card key={field.key} sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <FolderIcon color="primary" />
                <Typography variant="h6">{field.label}</Typography>
              </Stack>

              {childFieldsForGroup && childFieldsForGroup.length > 0 ? (
                <Box sx={{ pl: 2 }}>
                  {childFieldsForGroup.map((childField) => renderField(childField))}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Nenhum campo neste grupo
                </Typography>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const currentFields = training?.data?.snapshot?.fields
    ?.filter((f) => f.formType === currentTab && f.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)

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
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              {training.participants.length === 1
                ? training.participants[0].name
                : `${training.participants.length} atletas`}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TimerIcon fontSize="small" />
              <Typography variant="body2">{formattedTime}</Typography>
            </Stack>
          </Box>
          <LoadingButton onClick={handleSave} loading={isSaving}>
            Salvar
          </LoadingButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', pb: 10 }}>
        <Box sx={{ p: 2 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Modelo
              </Typography>
              <Typography variant="h6">{training.data.snapshot.modelName}</Typography>
              <Chip label={training.data.snapshot.sportName} size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <Tabs
              value={currentTab}
              onChange={(_, value) => setCurrentTab(value)}
              variant="fullWidth"
            >
              <Tab label="Formulário Geral" value="general" />
              <Tab label="Formulário do Atleta" value="athlete" />
            </Tabs>

            <CardContent>
              {/* Seletor de Atleta para Formulário do Atleta */}
              {currentTab === 'athlete' && training.participants.length > 1 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Selecione o atleta para preencher:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {training.participants.map((participant) => (
                      <Chip
                        key={participant.id}
                        label={participant.name}
                        onClick={() => setSelectedAthleteId(participant.id)}
                        color={selectedAthleteId === participant.id ? 'primary' : 'default'}
                        variant={selectedAthleteId === participant.id ? 'filled' : 'outlined'}
                        avatar={
                          <Avatar src={participant.photo || undefined}>
                            {participant.name.charAt(0)}
                          </Avatar>
                        }
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {currentFields && currentFields.length > 0 ? (
                currentFields.map((field) => renderField(field))
              ) : (
                <Typography color="text.secondary">Nenhum campo nesta seção</Typography>
              )}

              {/* Notas */}
              <TextField
                label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={4}
                fullWidth
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Botão Finalizar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <LoadingButton
          fullWidth
          variant="contained"
          size="large"
          onClick={() => setFinishDialogOpen(true)}
          loading={isSaving}
        >
          Finalizar Treino
        </LoadingButton>
      </Box>

      {/* Dialog de confirmação */}
      <FinishTrainingDialog
        open={finishDialogOpen}
        onConfirm={handleFinish}
        onCancel={() => setFinishDialogOpen(false)}
        currentDuration={Math.floor(
          (Date.now() - new Date(training.data.startTime).getTime()) / 1000
        )}
        startTime={new Date(training.data.startTime)}
        loading={isSaving}
      />

      {/* Notificação de Recorde */}
      {recordNotification && (
        <RecordNotification
          open={!!recordNotification}
          onClose={() => setRecordNotification(null)}
          fieldLabel={recordNotification.fieldLabel}
          value={recordNotification.newValue}
          unit={recordNotification.unit}
        />
      )}
    </Box>
  )
}
