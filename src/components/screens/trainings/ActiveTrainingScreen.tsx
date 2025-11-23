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
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import useSWR from 'swr'
import { AthleteForm, type AthleteFormRef } from './AthleteForm'

interface ActiveTrainingScreenProps {
  trainingId: number
}

export function ActiveTrainingScreen({ trainingId }: ActiveTrainingScreenProps) {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<'general' | 'athlete'>('general')
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [recordNotification, setRecordNotification] = useState<PersonalRecordCheck | null>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  // Estado para persistir valores dos formulários dos atletas
  const [athleteFormValues, setAthleteFormValues] = useState<Record<number, Record<string, any>>>(
    {}
  )

  const {
    control: generalControl,
    setValue: setGeneralValue,
    getValues: getGeneralValues,
    trigger: triggerGeneral,
    formState: { errors: generalErrors },
  } = useForm()

  const { data: training, isLoading } = useSWR(
    `training-${trainingId}`,
    () => getTrainingById(trainingId),
    {
      refreshInterval: 0, // Não atualizar automaticamente
    }
  )

  // Refs para os formulários dos atletas
  const athleteFormRefs = useRef<Map<number, AthleteFormRef>>(new Map())

  const { formattedTime } = useStopwatch(training?.data?.startTime)

  // Memoizar fields para evitar remontagem desnecessária dos formulários
  const snapshotFields = useMemo(
    () => training?.data?.snapshot?.fields || [],
    [training?.data?.snapshot?.fields]
  )

  const generalFields = useMemo(
    () =>
      snapshotFields
        .filter((f) => f.formType === 'general' && f.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [snapshotFields]
  )

  // Memoizar athleteValues para evitar mudanças de referência
  const athleteValues = useMemo(
    () => training?.data?.athleteValues || {},
    [training?.data?.athleteValues]
  )

  // Callback para quando valores dos formulários dos atletas mudarem
  const handleAthleteValuesChange = useCallback(
    (athleteId: number, values: Record<string, any>) => {
      setAthleteFormValues((prev) => ({
        ...prev,
        [athleteId]: {
          ...(prev[athleteId] || {}),
          ...values,
        },
      }))
    },
    []
  )

  // Persistir valores dos formulários ao trocar de tab
  const handleTabChange = (newTab: 'general' | 'athlete') => {
    // Antes de trocar, persistir valores atuais dos formulários de atletas
    if (currentTab === 'athlete' && training) {
      training.participants.forEach((participant) => {
        const formRef = athleteFormRefs.current.get(participant.id)
        if (formRef) {
          const currentValues = formRef.getValues()
          handleAthleteValuesChange(participant.id, currentValues)
        }
      })
    }
    setCurrentTab(newTab)
  }

  useEffect(() => {
    if (training?.data?.values) {
      Object.entries(training.data.values).forEach(([key, value]) => {
        setGeneralValue(key, value)
      })
    }

    // Carregar observações individuais dos atletas (se existirem)
    if (training?.data?.athleteValues) {
      const loadedAthleteNotes: Record<number, string> = {}
      Object.entries(training.data.athleteValues).forEach(([athleteId, values]) => {
        if (values && typeof values === 'object' && 'observacoes' in values) {
          loadedAthleteNotes[Number(athleteId)] = values.observacoes as string
        }
      })
    }

    if (training?.participants && training.participants.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(training.participants[0].id)
    }
  }, [training, selectedAthleteId, setGeneralValue])

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const generalValues = getGeneralValues()

      // Coletar valores dos formulários dos atletas (usar valores persistidos + valores atuais)
      const athleteValuesToSave: Record<number, Record<string, any>> = {}
      training?.participants.forEach((participant) => {
        const formRef = athleteFormRefs.current.get(participant.id)
        const persistedValues = athleteFormValues[participant.id] || {}

        if (formRef) {
          const currentValues = formRef.getValues()
          // IMPORTANTE: Priorizar currentValues sobre persistedValues
          // Só usar persistedValues para campos que não existem em currentValues
          const mergedValues: Record<string, any> = { ...persistedValues }
          Object.entries(currentValues).forEach(([key, value]) => {
            // Se o valor atual não está vazio, usar ele
            if (value !== '' && value !== undefined && value !== null) {
              mergedValues[key] = value
            }
          })
          if (Object.keys(mergedValues).length > 0) {
            athleteValuesToSave[participant.id] = mergedValues
          }
        } else if (Object.keys(persistedValues).length > 0) {
          // Se não há ref mas há valores persistidos, usar os persistidos
          athleteValuesToSave[participant.id] = persistedValues
        }
      })

      await updateTrainingData(trainingId, generalValues, undefined, athleteValuesToSave)
    } catch (error) {
      console.error('Erro ao salvar treino:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleValidateAndOpenDialog = async () => {
    if (!training) return

    try {
      setIsSaving(true)

      // Validar formulário geral primeiro
      const isGeneralValid = await triggerGeneral()
      if (!isGeneralValid) {
        setSnackbarMessage('Por favor, preencha todos os campos obrigatórios do formulário geral.')
        setSnackbarOpen(true)
        setIsSaving(false)
        return
      }

      // Validar formulários dos atletas - primeiro coletar valores atuais
      for (const participant of training.participants) {
        const formRef = athleteFormRefs.current.get(participant.id)
        if (formRef) {
          const isAthleteValid = (await formRef.trigger?.()) ?? true
          if (!isAthleteValid) {
            setSnackbarMessage(
              `Por favor, preencha todos os campos obrigatórios do atleta: ${participant.name}`
            )
            setSnackbarOpen(true)
            setIsSaving(false)
            return
          }

          const currentValues = formRef.getValues()
          handleAthleteValuesChange(participant.id, currentValues)
        }
      }

      // Se não há erros, abrir o diálogo
      setFinishDialogOpen(true)
    } catch (error) {
      console.error('Erro ao validar formulários:', error)
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

      const isGeneralValid = await triggerGeneral()
      if (!isGeneralValid) {
        setSnackbarMessage('Por favor, preencha todos os campos obrigatórios do formulário geral.')
        setSnackbarOpen(true)
        setIsSaving(false)
        setFinishDialogOpen(false)
        return
      }

      const generalValues = getGeneralValues()

      // Validar e coletar formulários dos atletas (usar valores persistidos)
      const athleteValuesToFinish: Record<number, Record<string, any>> = {}
      for (const participant of training.participants) {
        const formRef = athleteFormRefs.current.get(participant.id)
        const persistedValues = athleteFormValues[participant.id] || {}

        if (formRef) {
          const isAthleteValid = (await formRef.trigger?.()) ?? true
          if (!isAthleteValid) {
            setSnackbarMessage(
              `Por favor, preencha todos os campos obrigatórios do atleta: ${participant.name}`
            )
            setSnackbarOpen(true)
            setIsSaving(false)
            setFinishDialogOpen(false)
            return
          }

          const currentValues = formRef.getValues()
          const mergedValues: Record<string, any> = { ...persistedValues }
          Object.entries(currentValues).forEach(([key, value]) => {
            if (value !== '' && value !== undefined && value !== null) {
              mergedValues[key] = value
            }
          })

          handleAthleteValuesChange(participant.id, mergedValues)

          if (Object.keys(mergedValues).length > 0) {
            athleteValuesToFinish[participant.id] = mergedValues
          }
        } else if (Object.keys(persistedValues).length > 0) {
          // Se não há ref mas há valores persistidos, usar os persistidos
          athleteValuesToFinish[participant.id] = persistedValues
        }
      }

      // Usar o primeiro participante para verificar recordes
      const firstParticipant = training.participants[0]
      if (!firstParticipant) {
        throw new Error('Treino sem participantes')
      }

      // Verificar recordes pessoais antes de finalizar
      const recordChecks = await checkPersonalRecords(
        firstParticipant.id,
        training.data.snapshot.modelId,
        generalValues,
        training.data.snapshot.fields
      )

      // Finalizar treino com tempo customizado
      await finishTraining(
        trainingId,
        generalValues,
        customDuration,
        customStartTime,
        customEndTime,
        athleteValuesToFinish
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
      // Usar replace para substituir a página ativa no histórico
      setTimeout(() => {
        router.replace(`/dashboard/trainings/${trainingId}`)
      }, 2000)
    } catch (error) {
      console.error('Erro ao finalizar treino:', error)
    } finally {
      setIsSaving(false)
      setFinishDialogOpen(false)
    }
  }

  const renderGeneralField = (field: TrainingModelField) => {
    const fieldKey = field.key

    switch (field.fieldType) {
      case 'text':
        return (
          <Controller
            key={fieldKey}
            name={fieldKey}
            control={generalControl}
            rules={{ required: field.isRequired ? `${field.label} é obrigatório` : false }}
            defaultValue=""
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                label={field.label}
                required={field.isRequired}
                fullWidth
                error={!!generalErrors?.[fieldKey]}
                helperText={generalErrors?.[fieldKey]?.message as string}
                sx={{ mb: 2 }}
              />
            )}
          />
        )

      case 'number':
        return (
          <Controller
            key={fieldKey}
            name={fieldKey}
            control={generalControl}
            rules={{ required: field.isRequired ? `${field.label} é obrigatório` : false }}
            defaultValue=""
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                label={field.label}
                type="number"
                required={field.isRequired}
                fullWidth
                error={!!generalErrors?.[fieldKey]}
                helperText={generalErrors?.[fieldKey]?.message as string}
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
                onChange={(e) => controllerField.onChange(Number(e.target.value))}
                sx={{ mb: 2 }}
              />
            )}
          />
        )

      case 'boolean':
        return (
          <Controller
            key={fieldKey}
            name={fieldKey}
            control={generalControl}
            defaultValue={false}
            render={({ field: controllerField }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={controllerField.value || false}
                    onChange={(e) => controllerField.onChange(e.target.checked)}
                  />
                }
                label={field.label}
                sx={{ mb: 2 }}
              />
            )}
          />
        )

      case 'choice':
        return (
          <Controller
            key={fieldKey}
            name={fieldKey}
            control={generalControl}
            rules={{ required: field.isRequired ? `${field.label} é obrigatório` : false }}
            defaultValue=""
            render={({ field: controllerField }) => (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1 }}
                  color={generalErrors?.[fieldKey] ? 'error' : 'inherit'}
                >
                  {field.label} {field.isRequired && '*'}
                </Typography>
                <RadioGroup {...controllerField}>
                  {field.config?.options?.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
                {generalErrors?.[fieldKey] && (
                  <Typography variant="caption" color="error">
                    {generalErrors[fieldKey]?.message as string}
                  </Typography>
                )}
              </Box>
            )}
          />
        )

      case 'multiple-choice':
        return (
          <Controller
            key={fieldKey}
            name={fieldKey}
            control={generalControl}
            defaultValue={[] as string[]}
            render={({ field: controllerField }) => (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {field.label} {field.isRequired && '*'}
                </Typography>
                <FormGroup>
                  {field.config?.options?.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      control={
                        <Checkbox
                          checked={controllerField.value?.includes(option.id) || false}
                          onChange={(e) => {
                            const currentValue = controllerField.value || []
                            const newValue = e.target.checked
                              ? [...currentValue, option.id]
                              : currentValue.filter((id: string) => id !== option.id)
                            controllerField.onChange(newValue)
                          }}
                        />
                      }
                      label={option.label}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
          />
        )

      case 'expandable-boolean':
        const childFieldsForBoolean = training?.data?.snapshot?.fields
          ?.filter((f) => f.parentId === field.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)

        return (
          <Controller
            key={fieldKey}
            name={fieldKey}
            control={generalControl}
            defaultValue={false}
            render={({ field: controllerField }) => (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={controllerField.value || false}
                        onChange={(e) => controllerField.onChange(e.target.checked)}
                      />
                    }
                    label={field.label}
                  />

                  {/* Mostrar campos filhos apenas se o valor for true */}
                  {controllerField.value &&
                    childFieldsForBoolean &&
                    childFieldsForBoolean.length > 0 && (
                      <Box sx={{ ml: 4, mt: 2, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Campos condicionais:
                        </Typography>
                        {childFieldsForBoolean.map((childField) => renderGeneralField(childField))}
                      </Box>
                    )}
                </CardContent>
              </Card>
            )}
          />
        )

      case 'group':
        const childFieldsForGroup = training?.data?.snapshot?.fields
          ?.filter((f) => f.parentId === field.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)

        return (
          <Card key={fieldKey} sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <FolderIcon color="primary" />
                <Typography variant="h6">{field.label}</Typography>
              </Stack>

              {childFieldsForGroup && childFieldsForGroup.length > 0 ? (
                <Box sx={{ pl: 2 }}>
                  {childFieldsForGroup.map((childField) => renderGeneralField(childField))}
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
              onChange={(_, value) => handleTabChange(value)}
              variant="fullWidth"
            >
              <Tab label="Formulário Geral" value="general" />
              <Tab label="Formulário do Atleta" value="athlete" />
            </Tabs>

            <CardContent>
              <Box sx={{ display: currentTab === 'general' ? 'block' : 'none' }}>
                {generalFields.length > 0 ? (
                  generalFields.map((field) => renderGeneralField(field))
                ) : (
                  <Typography color="text.secondary">Nenhum campo nesta seção</Typography>
                )}
              </Box>

              <Box sx={{ display: currentTab === 'athlete' ? 'block' : 'none' }}>
                {/* Seletor de Atleta para Formulário do Atleta */}
                {training.participants.length > 1 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Selecione o atleta para preencher:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {training.participants.map((participant) => (
                        <Chip
                          key={participant.id}
                          label={participant.name}
                          onClick={() => {
                            if (selectedAthleteId) {
                              const formRef = athleteFormRefs.current.get(selectedAthleteId)
                              if (formRef) {
                                handleAthleteValuesChange(selectedAthleteId, formRef.getValues())
                              }
                            }
                            setSelectedAthleteId(participant.id)
                          }}
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

                {training.participants.map((participant) => (
                  <Box
                    key={participant.id}
                    sx={{ display: selectedAthleteId === participant.id ? 'block' : 'none' }}
                  >
                    <AthleteForm
                      ref={(ref) => {
                        if (ref) {
                          athleteFormRefs.current.set(participant.id, ref)
                        }
                      }}
                      athleteId={participant.id}
                      athleteName={participant.name}
                      fields={snapshotFields}
                      initialValues={athleteValues[participant.id]}
                      onValuesChange={handleAthleteValuesChange}
                    />
                  </Box>
                ))}
              </Box>
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
          onClick={handleValidateAndOpenDialog}
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

      {/* Snackbar para mensagens de validação */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
