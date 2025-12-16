'use client'

import { FitnessCenter } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const MIN_SUBMIT_TIME_MS = 5000

function generateConfirmKey() {
  // Simple client-side token to ensure JS ran; not a cryptographic guarantee.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Honeypot / bot checks
  const [formRenderTime, setFormRenderTime] = useState<number>(0)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [confirmKeyExpected, setConfirmKeyExpected] = useState('')
  const [confirmKeyValue, setConfirmKeyValue] = useState('')

  useEffect(() => {
    setFormRenderTime(Date.now())
    const key = generateConfirmKey()
    setConfirmKeyExpected(key)
    setConfirmKeyValue(key)
  }, [])

  const confirmKeyReady = useMemo(
    () => Boolean(confirmKeyExpected) && confirmKeyValue === confirmKeyExpected,
    [confirmKeyExpected, confirmKeyValue]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 1) Time check: bots are often too fast.
    const elapsed = Date.now() - (formRenderTime || 0)
    if (!formRenderTime || elapsed < MIN_SUBMIT_TIME_MS) {
      setError('Não foi possível concluir o login. Tente novamente.')
      return
    }

    // 2) CSS honeypot: if hidden field is filled, treat as bot.
    if (websiteUrl.trim().length > 0) {
      setError('Não foi possível concluir o login. Tente novamente.')
      return
    }

    // 3) JS token: if missing/mismatch, treat as non-JS/bot.
    if (!confirmKeyReady) {
      setError('Não foi possível concluir o login. Tente novamente.')
      return
    }

    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha incorretos')
        setLoading(false)
        return
      }

      if (result?.ok) {
        router.push('/dashboard/trainings')
        router.refresh()
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100lvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        px: 2,
        py: 2,
      }}
    >
      <Card
        sx={{
          w: '100%',
          maxWidth: '90%',
          height: '80lvh',
          p: { xs: 2.5, sm: 3 },
          boxShadow: (theme) => theme.customShadows.card,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo/Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <FitnessCenter sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              textAlign: 'center',
            }}
          >
            Adap Treino
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: { xs: '0.875rem', sm: '0.9rem' } }}
          >
            Gerencie seus treinos
          </Typography>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Honeypot fields: visually hidden, but present in DOM to catch bots */}
            <TextField
              label="Website"
              name="website-url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              sx={{
                position: 'absolute',
                left: '-9999px',
                top: 'auto',
                width: 1,
                height: 1,
                overflow: 'hidden',
              }}
            />

            <TextField
              label="Confirm"
              name="confirm-key"
              value={confirmKeyValue}
              onChange={(e) => setConfirmKeyValue(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              sx={{
                position: 'absolute',
                left: '-9999px',
                top: 'auto',
                width: 1,
                height: 1,
                overflow: 'hidden',
              }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoFocus
              variant="outlined"
              size="medium"
              slotProps={{
                input: {
                  sx: {
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    py: { xs: 1.2, sm: 1.5 },
                  },
                },
                inputLabel: {
                  sx: {
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Senha"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              variant="outlined"
              size="medium"
              slotProps={{
                input: {
                  sx: {
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    py: { xs: 1.2, sm: 1.5 },
                  },
                },
                inputLabel: {
                  sx: {
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  },
                },
              }}
            />

            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={loading || !email || !password}
              sx={{
                mt: 2,
                py: { xs: 1.8, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Entrar'}
            </Button>
          </Stack>
        </Box>
      </Card>
    </Box>
  )
}
