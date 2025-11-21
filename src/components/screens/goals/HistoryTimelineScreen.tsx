'use client'

import { GoalTimelineEntry } from '@/types/goal'
import { CheckCircle, ChevronRight, Close, Timelapse } from '@mui/icons-material'
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import React from 'react'
import { EmptyState } from '../../common/EmptyState'

interface HistoryTimelineScreenProps {
  history: GoalTimelineEntry[]
  onSelectGoal?: (goalId: number) => void
}

const STATUS_STYLES: Record<
  GoalTimelineEntry['status'],
  { bg: string; icon: React.ReactNode; label: string }
> = {
  active: {
    bg: 'rgba(25, 118, 210, 0.08)',
    icon: <Timelapse color="info" fontSize="small" />,
    label: 'Em andamento',
  },
  completed: {
    bg: 'rgba(76, 175, 80, 0.15)',
    icon: <CheckCircle color="success" fontSize="small" />,
    label: 'Alcançada',
  },
  expired: {
    bg: 'rgba(239, 83, 80, 0.15)',
    icon: <Close color="error" fontSize="small" />,
    label: 'Expirada',
  },
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function HistoryTimelineScreen({ history, onSelectGoal }: HistoryTimelineScreenProps) {
  if (history.length === 0) {
    return (
      <EmptyState
        title="Nenhum histórico ainda"
        description="Conclua ou expire metas para construir uma linha do tempo."
      />
    )
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative', pl: 3 }}>
      {history.map((entry, index) => {
        const status = STATUS_STYLES[entry.status]

        return (
          <Box key={entry.id} sx={{ display: 'flex', position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: index === history.length - 1 ? 'auto' : -24,
                width: 2,
                bgcolor: index === history.length - 1 ? 'transparent' : 'divider',
                ml: -2,
              }}
            />
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor:
                  entry.status === 'completed'
                    ? 'success.main'
                    : entry.status === 'expired'
                      ? 'error.main'
                      : 'info.main',
                position: 'absolute',
                left: -8,
                top: 12,
              }}
            />
            <Card sx={{ flex: 1, borderRadius: 3, backgroundColor: status.bg }}>
              {onSelectGoal ? (
                <CardActionArea onClick={() => onSelectGoal(entry.id)} sx={{ display: 'block' }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      gap={1}
                    >
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {entry.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {status.icon}
                          <Typography variant="body2" fontWeight={600}>
                            {status.label} · {formatDate(entry.date)}
                          </Typography>
                        </Box>
                      </Box>
                      <ChevronRight sx={{ color: 'text.secondary', mt: 0.5 }} fontSize="small" />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              ) : (
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1}
                  >
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {entry.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {status.icon}
                        <Typography variant="body2" fontWeight={600}>
                          {status.label} · {formatDate(entry.date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              )}
            </Card>
          </Box>
        )
      })}
    </Stack>
  )
}
