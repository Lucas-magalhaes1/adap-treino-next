'use client'

import { GoalValueField } from '@/components/common/GoalValueField'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Dialog, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface GoalProgressFormValues {
  currentValue: number
  notes?: string
}

interface UpdateProgressDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: GoalProgressFormValues) => Promise<void>
  unit: string
}

export function UpdateProgressDialog({ open, onClose, onSubmit, unit }: UpdateProgressDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalProgressFormValues>({
    defaultValues: {
      currentValue: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) {
      reset({ currentValue: 0, notes: '' })
    }
  }, [open, reset])

  const submit = async (values: GoalProgressFormValues) => {
    try {
      await onSubmit(values)
      reset({ currentValue: 0, notes: '' })
      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onClose={() => !isSubmitting && onClose()} fullWidth>
      <DialogTitle>Atualizar Progresso</DialogTitle>
      <DialogContent>
        <Stack spacing={2} component="form" onSubmit={handleSubmit(submit)} sx={{ mt: 1 }}>
          <GoalValueField<GoalProgressFormValues>
            name="currentValue"
            label="Valor Atual"
            control={control}
            unit={unit}
            error={!!errors.currentValue}
            helperText={errors.currentValue?.message}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField {...field} multiline minRows={3} label="Notas (opcional)" fullWidth />
            )}
          />

          <LoadingButton
            variant="contained"
            type="submit"
            loading={isSubmitting}
            loadingText="Salvando..."
            sx={{ borderRadius: 999 }}
          >
            Salvar atualização
          </LoadingButton>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            Use este registro para capturar como os treinos evoluíram.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
