'use client'

import { LoadingButton } from '@/components/common/LoadingButton'
import { Dialog, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface SportDialogProps {
  open: boolean
  sport?: { id: number; name: string } | null
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export function SportDialog({ open, sport, onClose, onSubmit }: SportDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
    },
  })

  useEffect(() => {
    if (open && sport) {
      reset({ name: sport.name })
    } else if (open) {
      reset({ name: '' })
    }
  }, [open, sport, reset])

  const handleFormSubmit = async (data: { name: string }) => {
    await onSubmit(data.name)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{sport ? 'Editar Esporte' : 'Novo Esporte'}</DialogTitle>
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
                  label="Nome do esporte"
                  placeholder="Ex: Natação, Ciclismo, Corrida"
                  fullWidth
                  autoFocus
                  error={!!errors.name}
                  helperText={errors.name?.message}
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
              {sport ? 'SALVAR ALTERAÇÕES' : 'CRIAR ESPORTE'}
            </LoadingButton>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  )
}
