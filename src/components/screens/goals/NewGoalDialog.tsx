'use client'

import { GoalValueField } from '@/components/common/GoalValueField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { GoalFormSchema, goalFormSchema } from '@/schemas/goalSchema'
import { UNIT_OPTIONS } from '@/utils/goalConstants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
import { Controller, type Resolver, useForm } from 'react-hook-form'

interface NewGoalDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: GoalFormSchema) => Promise<void>
}

export function NewGoalDialog({ open, onClose, onSubmit }: NewGoalDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormSchema>({
    resolver: zodResolver(goalFormSchema) as Resolver<GoalFormSchema>,
    defaultValues: {
      title: '',
      startValue: undefined,
      targetValue: undefined,
      unit: UNIT_OPTIONS[0],
      targetDate: '',
      notes: '',
    },
  })

  const selectedUnit = watch('unit')

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const submit = async (values: GoalFormSchema) => {
    try {
      await onSubmit(values)
      reset()
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onClose={() => !isSubmitting && onClose()} fullWidth>
      <DialogTitle>Nova Meta</DialogTitle>
      <DialogContent>
        <Stack spacing={2} component="form" onSubmit={handleSubmit(submit)} sx={{ mt: 1 }}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Título da Meta"
                placeholder="Ex: Agachamento Livre"
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
              <TextField {...field} select label="Unidade" fullWidth>
                {UNIT_OPTIONS.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <GoalValueField<GoalFormSchema>
            name="startValue"
            label="Marca Inicial / Atual"
            control={control}
            unit={selectedUnit}
            error={!!errors.startValue}
            helperText={errors.startValue?.message}
          />

          <GoalValueField<GoalFormSchema>
            name="targetValue"
            label="Meta a ser alcançada"
            control={control}
            unit={selectedUnit}
            error={!!errors.targetValue}
            helperText={errors.targetValue?.message}
          />

          <Controller
            name="targetDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="date"
                label="Data alvo"
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!errors.targetDate}
                helperText={errors.targetDate?.message}
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
                label="Notas / Estratégia (opcional)"
                placeholder="Adicione detalhes ou estratégia aqui"
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
            SALVAR
          </LoadingButton>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
