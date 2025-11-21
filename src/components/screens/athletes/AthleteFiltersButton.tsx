'use client'

import { FilterList } from '@mui/icons-material'
import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'

export interface AthleteFilters {
  gender?: 'male' | 'female' | 'other' | null
}

interface AthleteFiltersButtonProps {
  filters: AthleteFilters
  onFiltersChange: (filters: AthleteFilters) => void
}

export function AthleteFiltersButton({ filters, onFiltersChange }: AthleteFiltersButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<AthleteFilters>(filters)

  // Contar filtros ativos
  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== null && v !== undefined
  ).length

  const handleApply = () => {
    onFiltersChange(localFilters)
    setDrawerOpen(false)
  }

  const handleClear = () => {
    const clearedFilters: AthleteFilters = { gender: null }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    setDrawerOpen(false)
  }

  const handleGenderChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      gender: value === 'all' ? null : (value as 'male' | 'female' | 'other'),
    })
  }

  return (
    <>
      <Badge badgeContent={activeFiltersCount} color="primary">
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={() => setDrawerOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Filtros
        </Button>
      </Badge>

      <Drawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ p: 3, maxWidth: 'sm', mx: 'auto', width: '100%' }}>
          <Stack spacing={3}>
            {/* Header */}
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Filtros
              </Typography>
              <Divider />
            </Box>

            {/* Filtro de Gênero */}
            <FormControl component="fieldset">
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Gênero
              </Typography>
              <RadioGroup
                value={localFilters.gender || 'all'}
                onChange={(e) => handleGenderChange(e.target.value)}
              >
                <FormControlLabel value="all" control={<Radio />} label="Todos" />
                <FormControlLabel value="male" control={<Radio />} label="Masculino" />
                <FormControlLabel value="female" control={<Radio />} label="Feminino" />
                <FormControlLabel value="other" control={<Radio />} label="Outro" />
              </RadioGroup>
            </FormControl>

            {/* TODO: Adicionar mais filtros aqui no futuro */}

            {/* Ações */}
            <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" onClick={handleClear} sx={{ borderRadius: 2 }}>
                Limpar
              </Button>
              <Button fullWidth variant="contained" onClick={handleApply} sx={{ borderRadius: 2 }}>
                Aplicar
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>
    </>
  )
}
