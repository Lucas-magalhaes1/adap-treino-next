'use client'

import { GoalValueField } from '@/components/common/GoalValueField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { PersonalRecordFormSchema, personalRecordFormSchema } from '@/schemas/personalRecordSchema'
import { PersonalRecordSummary } from '@/types/goal'
import { UNIT_OPTIONS } from '@/utils/goalConstants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
import { Controller, type Resolver, useForm } from 'react-hook-form'

interface EditPersonalRecordDialogProps {
  open: boolean
  record?: PersonalRecordSummary | null
  onClose: () => void
  onSubmit: (values: PersonalRecordFormSchema) => Promise<void>
}

export function EditPersonalRecordDialog({
  open,
  record,
  onClose,
  onSubmit,
}: EditPersonalRecordDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonalRecordFormSchema>({
    resolver: zodResolver(personalRecordFormSchema) as Resolver<PersonalRecordFormSchema>,
    defaultValues: {
      title: '',
      value: 0,
      unit: UNIT_OPTIONS[0],
      dateAchieved: '',
      notes: '',
    },
  })

  const selectedUnit = watch('unit')

  useEffect(() => {
    if (open && record) {
      reset({
        title: record.title,
        value: record.value,
        unit: record.unit,
        dateAchieved: record.dateAchieved.split('T')[0],
        notes: record.notes ?? '',
      })
    }
  }, [open, record, reset])

  const handleFormSubmit = async (data: PersonalRecordFormSchema) => {
    await onSubmit(data)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Recorde Pessoal</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack spacing={3} mt={1}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Título do recorde"
                  placeholder="Ex: Corrida 10km, Levantamento Terra, etc"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Unidade de medida"
                  fullWidth
                  error={!!errors.unit}
                  helperText={errors.unit?.message}
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <GoalValueField
              name="value"
              control={control}
              label="Valor do recorde"
              unit={selectedUnit}
              error={!!errors.value}
              helperText={errors.value?.message}
            />

            <Controller
              name="dateAchieved"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Data de conquista"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={!!errors.dateAchieved}
                  helperText={errors.dateAchieved?.message}
                />
              )}
            />

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  multiline
                  minRows={3}
                  label="Notas (opcional)"
                  placeholder="Adicione detalhes sobre este recorde"
                  fullWidth
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
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
              SALVAR ALTERAÇÕES
            </LoadingButton>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  )
}
