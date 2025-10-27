'use client'

import { Logout } from '@mui/icons-material'
import { Box, Button, Card, Container, Typography } from '@mui/material'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({
      redirect: false,
    })
    router.push('/auth/login')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            boxShadow: (theme) => theme.customShadows.card,
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tem certeza?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Você será desconectado da aplicação
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
            >
              Sair
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  )
}
