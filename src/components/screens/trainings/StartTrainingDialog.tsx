'use client'

import { getAthleteGroups } from '@/actions/athleteGroups'
import { getTrainingModels } from '@/actions/trainingModels'
import { createTraining } from '@/actions/trainings'
import { LoadingButton } from '@/components/common/LoadingButton'
import { useAthletes } from '@/hooks/useAthletes'
import { Close as CloseIcon, Groups as GroupsIcon, Person as PersonIcon } from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'

interface StartTrainingDialogProps {
  open: boolean
  onClose: () => void
}

export function StartTrainingDialog({ open, onClose }: StartTrainingDialogProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<number[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectionTab, setSelectionTab] = useState<'individual' | 'group'>('individual')

  const { athletes } = useAthletes()
  const { data: models } = useSWR('training-models-all', getTrainingModels)
  const { data: groupsResponse } = useSWR('athlete-groups', getAthleteGroups)
  const groups = groupsResponse?.success ? groupsResponse.data : []

  const handleClose = () => {
    setCurrentStep(0)
    setSelectedAthleteIds([])
    setSelectedModelId(null)
    setSelectionTab('individual')
    onClose()
  }

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const toggleAthlete = (athleteId: number) => {
    setSelectedAthleteIds((prev) =>
      prev.includes(athleteId) ? prev.filter((id) => id !== athleteId) : [...prev, athleteId]
    )
  }

  const selectGroup = (groupId: number) => {
    const group = groups?.find((g) => g.id === groupId)
    if (!group) return

    const groupAthleteIds = group.members.map((m) => m.athlete.id)

    // Se todos os atletas do grupo já estão selecionados, desmarcar todos
    const allSelected = groupAthleteIds.every((id) => selectedAthleteIds.includes(id))

    if (allSelected) {
      setSelectedAthleteIds((prev) => prev.filter((id) => !groupAthleteIds.includes(id)))
    } else {
      // Adicionar todos os atletas do grupo
      setSelectedAthleteIds((prev) => {
        const newIds = [...prev]
        groupAthleteIds.forEach((id) => {
          if (!newIds.includes(id)) {
            newIds.push(id)
          }
        })
        return newIds
      })
    }
  }

  const handleStartTraining = async () => {
    if (selectedAthleteIds.length === 0 || !selectedModelId) return

    try {
      setIsSaving(true)

      // Criar um treino com todos os atletas selecionados como participantes
      const trainingId = await createTraining({
        athleteIds: selectedAthleteIds,
        modelId: selectedModelId,
      })

      // Navegar para tela de treino ativo
      router.push(`/dashboard/trainings/${trainingId}/active`)
      handleClose()
    } catch (error) {
      console.error('Erro ao iniciar treino:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const steps = ['Selecionar Atletas', 'Selecionar Modelo']

  const canProceed = () => {
    if (currentStep === 0) return selectedAthleteIds.length > 0
    if (currentStep === 1) return selectedModelId !== null
    return false
  }

  return (
    <Dialog fullScreen open={open} onClose={handleClose}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Novo Treino
          </Typography>
          {currentStep === steps.length - 1 ? (
            <LoadingButton onClick={handleStartTraining} loading={isSaving}>
              Iniciar Treino
            </LoadingButton>
          ) : (
            <Button color="inherit" onClick={handleNext} disabled={!canProceed()}>
              Próximo
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Passo 1: Selecionar Atletas */}
        {currentStep === 0 && (
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Selecione os atletas</Typography>
              <Chip
                label={`${selectedAthleteIds.length} selecionado${selectedAthleteIds.length !== 1 ? 's' : ''}`}
                color="primary"
                size="small"
              />
            </Stack>

            <Tabs
              value={selectionTab}
              onChange={(_, value) => setSelectionTab(value)}
              sx={{ mb: 2 }}
            >
              <Tab icon={<PersonIcon />} label="Individual" value="individual" />
              <Tab icon={<GroupsIcon />} label="Por Grupo" value="group" />
            </Tabs>

            {selectionTab === 'individual' && (
              <List>
                {athletes?.map((athlete) => (
                  <ListItemButton key={athlete.id} onClick={() => toggleAthlete(athlete.id)}>
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
                    <ListItemText
                      primary={athlete.name}
                      secondary={
                        athlete.sports?.find((s) => s.isMain)?.name || 'Sem esporte principal'
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}

            {selectionTab === 'group' && (
              <Box>
                {!groups || groups.length === 0 ? (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" align="center">
                        Nenhum grupo de atletas cadastrado
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Stack spacing={2}>
                    {groups.map((group) => {
                      const groupAthleteIds = group.members.map((m) => m.athlete.id)
                      const allSelected = groupAthleteIds.every((id) =>
                        selectedAthleteIds.includes(id)
                      )
                      const someSelected = groupAthleteIds.some((id) =>
                        selectedAthleteIds.includes(id)
                      )

                      return (
                        <Card
                          key={group.id}
                          variant="outlined"
                          sx={{
                            cursor: 'pointer',
                            border: allSelected ? 2 : 1,
                            borderColor: allSelected ? 'primary.main' : 'divider',
                            '&:hover': { borderColor: 'primary.main' },
                          }}
                          onClick={() => selectGroup(group.id)}
                        >
                          <CardContent>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box sx={{ flex: 1 }}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ mb: 1 }}
                                >
                                  <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected && !allSelected}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      selectGroup(group.id)
                                    }}
                                  />
                                  <Typography variant="h6">{group.name}</Typography>
                                  <Chip label={`${group.members.length} atletas`} size="small" />
                                </Stack>
                                {group.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                                    {group.description}
                                  </Typography>
                                )}
                              </Box>
                              <AvatarGroup max={4}>
                                {group.members.map((member) => (
                                  <Avatar
                                    key={member.athlete.id}
                                    src={member.athlete.photo || undefined}
                                    alt={member.athlete.name}
                                  >
                                    {member.athlete.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                ))}
                              </AvatarGroup>
                            </Stack>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </Stack>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Passo 2: Selecionar Modelo */}
        {currentStep === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Selecione o modelo de treino
            </Typography>

            <Button onClick={handleBack} sx={{ mb: 2 }}>
              Voltar
            </Button>

            <TextField
              select
              label="Modelo de Treino"
              fullWidth
              value={selectedModelId || ''}
              onChange={(e) => setSelectedModelId(Number(e.target.value))}
            >
              <MenuItem value="" disabled>
                Selecione um modelo
              </MenuItem>
              {models?.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  <Box>
                    <Typography variant="body1">{model.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {model.sport.name} • {model._count.fields} campos
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
