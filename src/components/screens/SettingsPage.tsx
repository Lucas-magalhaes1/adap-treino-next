'use client'

import { Box, Container, Typography } from '@mui/material'

export function SettingsPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Configurações
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Personalize seu perfil e gerencie esportes
        </Typography>
      </Box>

      {/* TODO: Adicionar configurações aqui */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">Opções de configuração virão aqui</Typography>
      </Box>
    </Container>
  )
}
