'use client'

import { LoadingButton } from '@/components/common/LoadingButton'
import { AccessTime as AccessTimeIcon, Edit as EditIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

interface FinishTrainingDialogProps {
  open: boolean
  onConfirm: (startTime: Date, endTime: Date, duration: number) => void
  onCancel: () => void
  currentDuration: number // em segundos
  startTime: Date
  loading?: boolean
}

export function FinishTrainingDialog({
  open,
  onConfirm,
  onCancel,
  currentDuration,
  startTime,
  loading = false,
}: FinishTrainingDialogProps) {
  const [mode, setMode] = useState<'confirm' | 'edit'>('confirm')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')

  // Calcular tempo final baseado no startTime e duration
  const calculatedEndTime = new Date(startTime.getTime() + currentDuration * 1000)

  // Inicializar valores apenas quando o dialog abrir pela primeira vez
  useEffect(() => {
    if (open) {
      // Preencher valores iniciais para modo edição
      const start = new Date(startTime)
      const end = new Date(startTime.getTime() + currentDuration * 1000)

      // Formato YYYY-MM-DD
      setCustomStartDate(start.toISOString().split('T')[0])
      // Formato HH:MM
      setCustomStartTime(
        `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
      )

      setCustomEndDate(end.toISOString().split('T')[0])
      setCustomEndTime(
        `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
      )
    } else {
      // Resetar o modo apenas quando o dialog fechar
      setMode('confirm')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Apenas open como dependência

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}min ${secs}s`
    }
    return `${minutes}min ${secs}s`
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const handleConfirm = () => {
    if (mode === 'confirm') {
      // Usar valores do cronômetro
      onConfirm(startTime, calculatedEndTime, currentDuration)
    } else {
      // Usar valores customizados
      const customStart = new Date(`${customStartDate}T${customStartTime}:00`)
      const customEnd = new Date(`${customEndDate}T${customEndTime}:00`)

      // Calcular duração em segundos
      const duration = Math.floor((customEnd.getTime() - customStart.getTime()) / 1000)

      if (duration <= 0) {
        alert('A data/hora de fim deve ser posterior ao início!')
        return
      }

      onConfirm(customStart, customEnd, duration)
    }
  }

  const getCustomDuration = () => {
    if (!customStartDate || !customStartTime || !customEndDate || !customEndTime) {
      return 0
    }

    const customStart = new Date(`${customStartDate}T${customStartTime}:00`)
    const customEnd = new Date(`${customEndDate}T${customEndTime}:00`)
    return Math.floor((customEnd.getTime() - customStart.getTime()) / 1000)
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Finalizar Treino</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Confirme o tempo do treino ou edite manualmente as datas de início e fim.
          </Typography>

          {/* Toggle entre Confirmar e Editar */}
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, value) => value && setMode(value)}
            fullWidth
            color="primary"
          >
            <ToggleButton value="confirm">
              <AccessTimeIcon sx={{ mr: 1 }} />
              Confirmar Cronômetro
            </ToggleButton>
            <ToggleButton value="edit">
              <EditIcon sx={{ mr: 1 }} />
              Editar Manualmente
            </ToggleButton>
          </ToggleButtonGroup>

          {mode === 'confirm' ? (
            /* Modo Confirmar - Mostrar valores do cronômetro */
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Início
                  </Typography>
                  <Typography variant="body1">{formatDateTime(startTime)}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fim
                  </Typography>
                  <Typography variant="body1">{formatDateTime(calculatedEndTime)}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Duração Total
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatDuration(currentDuration)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : (
            /* Modo Editar - Campos de entrada */
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Início do Treino
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField
                  label="Data"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
                <TextField
                  label="Hora"
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  inputProps={{
                    step: 60, // Passos de 1 minuto
                  }}
                />
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Fim do Treino
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  label="Data"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
                <TextField
                  label="Hora"
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  inputProps={{
                    step: 60, // Passos de 1 minuto
                  }}
                />
              </Stack>

              {/* Preview da duração customizada */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  border: 1,
                  borderColor: getCustomDuration() > 0 ? 'primary.main' : 'error.main',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Duração Total
                </Typography>
                <Typography
                  variant="h6"
                  color={getCustomDuration() > 0 ? 'primary' : 'error'}
                  sx={{ mt: 0.5 }}
                >
                  {getCustomDuration() > 0
                    ? formatDuration(getCustomDuration())
                    : 'Horário inválido'}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <LoadingButton
          onClick={handleConfirm}
          variant="contained"
          loading={loading}
          disabled={mode === 'edit' && getCustomDuration() <= 0}
        >
          Finalizar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
