'use client'

import { SentimentDissatisfied } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'

interface EmptyAthleteListProps {
  searchQuery?: string
  hasFilters?: boolean
}

export function EmptyAthleteList({ searchQuery, hasFilters }: EmptyAthleteListProps) {
  const getMessage = () => {
    if (searchQuery) {
      return `Nenhum atleta encontrado para "${searchQuery}"`
    }
    if (hasFilters) {
      return 'Nenhum atleta encontrado com esses filtros'
    }
    return 'Nenhum atleta cadastrado ainda'
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        py: 8,
      }}
    >
      <SentimentDissatisfied
        sx={{
          fontSize: 80,
          color: 'text.disabled',
          mb: 2,
        }}
      />
      <Typography color="text.secondary" variant="h6" textAlign="center">
        {getMessage()}
      </Typography>
      <Typography color="text.secondary" variant="body2" textAlign="center" sx={{ mt: 1 }}>
        {!searchQuery && !hasFilters && 'Adicione um novo atleta para começar'}
        {(searchQuery || hasFilters) && 'Tente ajustar sua busca ou filtros'}
      </Typography>
    </Box>
  )
}
