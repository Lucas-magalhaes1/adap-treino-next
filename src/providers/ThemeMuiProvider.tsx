// ThemeProvider.tsx - Configurar no provider
'use client'

import theme from '@/theme/theme'
import { CssBaseline, ThemeProvider } from '@mui/material'
import React from 'react'

export default function ThemeMuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
