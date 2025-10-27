'use client'

import { Box, Button, Card, Typography } from '@mui/material'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card
      sx={{
        textAlign: 'center',
        py: 6,
        px: 3,
        backgroundColor: 'background.neutral',
        border: '2px dashed',
        borderColor: 'divider',
      }}
    >
      {icon && <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>{icon}</Box>}
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  )
}
