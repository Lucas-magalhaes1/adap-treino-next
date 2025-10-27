'use client'

import { Box, Container, Typography } from '@mui/material'

export function ModelsPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Modelos de Treino
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure os modelos que serão usados nos treinos
        </Typography>
      </Box>

      {/* TODO: Adicionar modelos de treino aqui */}
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
        <Typography color="text.secondary">Modelos de treino virão aqui</Typography>
      </Box>
    </Container>
  )
}
