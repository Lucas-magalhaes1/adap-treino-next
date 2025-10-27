'use client'

import { Add } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

interface FloatingActionButtonProps {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
}

export function FloatingActionButton({
  icon = <Add />,
  label,
  onClick,
  color = 'primary',
}: FloatingActionButtonProps) {
  return (
    <Tooltip title={label}>
      <Fab
        color={color}
        aria-label={label}
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 88, // Acima da TabBar
          right: 16,
        }}
      >
        {icon}
      </Fab>
    </Tooltip>
  )
}
