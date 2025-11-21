'use client'

import type { ProgressionDataPoint } from '@/actions/trainingAnalytics'
import { Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ProgressionChartProps {
  data: ProgressionDataPoint[]
  fieldLabel: string
  unit?: string
  goalValue?: number // Meta a ser exibida como linha de referência
  goalLabel?: string
}

export function ProgressionChart({
  data,
  fieldLabel,
  unit,
  goalValue,
  goalLabel,
}: ProgressionChartProps) {
  const theme = useTheme()

  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {fieldLabel}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Sem dados suficientes para gerar gráfico
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Formatar dados para o recharts
  const chartData = data.map((point) => ({
    date: point.date.getTime(),
    dateFormatted: format(new Date(point.date), 'dd/MMM', { locale: ptBR }),
    value: point.value,
  }))

  // Calcular se a meta foi atingida
  const latestValue = data[data.length - 1]?.value
  const goalAchieved = goalValue && latestValue >= goalValue

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">{fieldLabel}</Typography>
          {goalValue && (
            <Chip
              label={
                goalAchieved
                  ? `✓ Meta atingida: ${goalValue} ${unit || ''}`
                  : `Meta: ${goalValue} ${unit || ''}`
              }
              size="small"
              color={goalAchieved ? 'success' : 'default'}
              variant={goalAchieved ? 'filled' : 'outlined'}
            />
          )}
        </Stack>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="dateFormatted"
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            />
            <YAxis
              label={{
                value: unit || '',
                angle: -90,
                position: 'insideLeft',
                style: { fill: theme.palette.text.secondary },
              }}
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
              formatter={(value: number) => [`${value} ${unit || ''}`, fieldLabel]}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
              }}
            />

            {/* Linha de Meta */}
            {goalValue && (
              <ReferenceLine
                y={goalValue}
                stroke={theme.palette.success.main}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: goalLabel || 'Meta',
                  fill: theme.palette.success.main,
                  fontSize: 12,
                  position: 'right',
                }}
              />
            )}

            {/* Linha de Progressão */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ r: 4, fill: theme.palette.primary.main }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
