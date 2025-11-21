'use client'

import { EmojiEvents, History, SportsScore } from '@mui/icons-material'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import React from 'react'

export type GoalsTab = 'active' | 'records' | 'history'

interface GoalsBottomNavigationProps {
  value: GoalsTab
  onChange: (value: GoalsTab) => void
}

const NAV_ITEMS: Array<{ value: GoalsTab; label: string; icon: React.ReactNode }> = [
  {
    value: 'active',
    label: 'Metas Ativas',
    icon: <SportsScore />,
  },
  {
    value: 'records',
    label: 'Recordes',
    icon: <EmojiEvents />,
  },
  {
    value: 'history',
    label: 'Histórico',
    icon: <History />,
  },
]

export function GoalsBottomNavigation({ value, onChange }: GoalsBottomNavigationProps) {
  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={8}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue: GoalsTab) => onChange(newValue)}
        sx={{
          '.MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'warning.main',
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.value}
            value={item.value}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
