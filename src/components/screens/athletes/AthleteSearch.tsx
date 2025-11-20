'use client'

import { Search } from '@mui/icons-material'
import { InputAdornment, TextField } from '@mui/material'

interface AthleteSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AthleteSearch({ value, onChange, placeholder }: AthleteSearchProps) {
  return (
    <TextField
      fullWidth
      placeholder={placeholder || 'Buscar Atletas...'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search color="action" />
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          backgroundColor: 'background.paper',
        },
      }}
    />
  )
}
