'use client'

import { LoadingButton } from '@/components/common/LoadingButton'
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface Athlete {
  id: number
  name: string
  photo?: string | null
}

interface AthleteGroupDialogProps {
  open: boolean
  group?: {
    id: number
    name: string
    description?: string | null
    members: { athlete: Athlete }[]
  } | null
  onClose: () => void
  onSubmit: (data: { name: string; description?: string; athleteIds: number[] }) => Promise<void>
}

export function AthleteGroupDialog({ open, group, onClose, onSubmit }: AthleteGroupDialogProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loadingAthletes, setLoadingAthletes] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      selectedAthletes: [] as Athlete[],
    },
  })

  useEffect(() => {
    if (open) {
      loadAthletes()
      if (group) {
        reset({
          name: group.name,
          description: group.description ?? '',
          selectedAthletes: group.members.map((m) => m.athlete),
        })
      } else {
        reset({ name: '', description: '', selectedAthletes: [] })
      }
    }
  }, [open, group, reset])

  const loadAthletes = async () => {
    setLoadingAthletes(true)
    try {
      const { getAllAthletes } = await import('@/actions/athleteGroups')
      const result = await getAllAthletes()
      if (result.success && result.data) {
        setAthletes(result.data)
      }
    } catch (error) {
      toast.error('Erro ao carregar atletas')
    } finally {
      setLoadingAthletes(false)
    }
  }

  const handleFormSubmit = async (data: any) => {
    await onSubmit({
      name: data.name,
      description: data.description,
      athleteIds: data.selectedAthletes.map((a: Athlete) => a.id),
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{group ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack spacing={3} mt={1}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Nome é obrigatório' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome do grupo"
                  placeholder="Ex: Fut Senior Quarta, Vôlei Misto"
                  fullWidth
                  autoFocus
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descrição (opcional)"
                  placeholder="Adicione detalhes sobre o grupo"
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}
            />

            <Controller
              name="selectedAthletes"
              control={control}
              rules={{
                validate: (value) => value.length > 0 || 'Selecione pelo menos um atleta',
              }}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  multiple
                  options={athletes}
                  loading={loadingAthletes}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  disableCloseOnSelect={true}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Atletas"
                      placeholder="Selecione os atletas"
                      error={!!errors.selectedAthletes}
                      helperText={errors.selectedAthletes?.message}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...restProps } = props as any
                    return (
                      <Box component="li" key={key} {...restProps} sx={{ gap: 2 }}>
                        <Avatar src={option.photo ?? undefined} sx={{ width: 32, height: 32 }}>
                          {option.name[0]}
                        </Avatar>
                        {option.name}
                      </Box>
                    )
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...restProps } = getTagProps({ index }) as any
                      return (
                        <Chip
                          key={key}
                          {...restProps}
                          avatar={<Avatar src={option.photo ?? undefined}>{option.name[0]}</Avatar>}
                          label={option.name}
                        />
                      )
                    })
                  }
                />
              )}
            />

            <LoadingButton
              variant="contained"
              type="submit"
              loading={isSubmitting}
              loadingText="Salvando..."
              size="large"
              sx={{ borderRadius: 999 }}
            >
              {group ? 'SALVAR ALTERAÇÕES' : 'CRIAR GRUPO'}
            </LoadingButton>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  )
}
