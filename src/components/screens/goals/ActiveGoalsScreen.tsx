'use client'

import { GoalSummary } from '@/types/goal'
import { formatValueByUnit } from '@/utils/goalFormatters'
import { ArrowForward } from '@mui/icons-material'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { EmptyState } from '../../common/EmptyState'

interface ActiveGoalsScreenProps {
  goals: GoalSummary[]
  onSelectGoal: (goalId: number) => void
  onCreateGoal: () => void
}

function formatDate(value: string | null) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleDateString('pt-BR')
}

export function ActiveGoalsScreen({ goals, onSelectGoal, onCreateGoal }: ActiveGoalsScreenProps) {
  if (goals.length === 0) {
    return (
      <EmptyState
        title="Sem metas registradas"
        description="Cadastre a primeira meta para acompanhar o progresso do atleta."
        action={{ label: 'Criar meta', onClick: onCreateGoal }}
      />
    )
  }

  return (
    <Stack spacing={2}>
      {goals.map((goal) => (
        <Card key={goal.id} sx={{ borderRadius: 3 }}>
          <CardActionArea onClick={() => onSelectGoal(goal.id)}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {goal.title}
                </Typography>
                <ArrowForward fontSize="small" color="disabled" />
              </Stack>

              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Meta
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatValueByUnit(goal.targetValue, goal.unit)} {goal.unit}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Atual
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    {formatValueByUnit(goal.currentValue ?? goal.startValue ?? 0, goal.unit)}{' '}
                    {goal.unit}
                  </Typography>
                </Box>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={goal.progressPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mb: 1,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: 'primary.main',
                  },
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Alvo até {formatDate(goal.targetDate)}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  )
}
