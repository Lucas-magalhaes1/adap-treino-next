'use client'

import { EmojiEvents as TrophyIcon } from '@mui/icons-material'
import { Alert, Box, Slide, Snackbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

interface RecordNotificationProps {
  open: boolean
  onClose: () => void
  fieldLabel: string
  value: number
  unit?: string
}

export function RecordNotification({
  open,
  onClose,
  fieldLabel,
  value,
  unit,
}: RecordNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      // Criar confete animado
      createConfetti()
    }
  }, [open])

  const createConfetti = () => {
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#98FB98']
    const confettiCount = 50

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.style.position = 'fixed'
      confetti.style.width = '10px'
      confetti.style.height = '10px'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.top = '-10px'
      confetti.style.opacity = '1'
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%'
      confetti.style.zIndex = '9999'
      confetti.style.pointerEvents = 'none'
      confetti.style.transition = 'all 3s ease-out'

      document.body.appendChild(confetti)

      // Animar
      setTimeout(() => {
        confetti.style.top = '100vh'
        confetti.style.opacity = '0'
        confetti.style.transform = `translateX(${Math.random() * 200 - 100}px) rotate(${Math.random() * 720}deg)`
      }, 10)

      // Remover após animação
      setTimeout(() => {
        document.body.removeChild(confetti)
      }, 3000)
    }
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={Slide}
    >
      <Alert
        onClose={onClose}
        severity="success"
        variant="filled"
        sx={{
          width: '100%',
          fontSize: '1.1rem',
          '& .MuiAlert-icon': {
            fontSize: '2rem',
          },
        }}
        icon={<TrophyIcon sx={{ color: '#FFD700' }} />}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            🎉 Novo Recorde Pessoal!
          </Typography>
          <Typography variant="body2" sx={{ color: 'white' }}>
            <strong>{fieldLabel}:</strong> {value} {unit || ''}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  )
}
