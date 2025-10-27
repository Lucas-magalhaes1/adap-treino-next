'use client'

import { Box, Container, Typography } from '@mui/material'

export function TrainingsPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Meus Treinos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualize seu histórico e inicie um novo treino
        </Typography>
      </Box>

      {/* TODO: Adicionar componentes de treinos aqui */}
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
        <Typography color="text.secondary">Componentes de treinos virão aqui</Typography>
      </Box>
    </Container>
  )
}
