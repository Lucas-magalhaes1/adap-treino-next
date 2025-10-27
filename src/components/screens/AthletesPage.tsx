'use client'

import { Box, Container, Typography } from '@mui/material'

export function AthletesPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Atletas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie seus atletas e acompanhe seu progresso
        </Typography>
      </Box>

      {/* TODO: Adicionar lista de atletas aqui */}
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
        <Typography color="text.secondary">Lista de atletas virá aqui</Typography>
      </Box>
    </Container>
  )
}
