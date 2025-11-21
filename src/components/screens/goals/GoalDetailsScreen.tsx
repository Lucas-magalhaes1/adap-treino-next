'use client'

import { GoalDetail } from '@/types/goal'
import { formatValueByUnit } from '@/utils/goalFormatters'
import { Close, Delete, Done, Edit } from '@mui/icons-material'
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface GoalDetailsScreenProps {
  goal?: GoalDetail | null
  open: boolean
  loading: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onUpdateProgress: () => void
  onMarkAsCompleted: () => void
}

function formatDate(value: string | null) {
  if (!value) return 'Sem data alvo'
  return new Date(value).toLocaleDateString('pt-BR')
}

export function GoalDetailsScreen({
  goal,
  open,
  loading,
  onClose,
  onEdit,
  onDelete,
  onUpdateProgress,
  onMarkAsCompleted,
}: GoalDetailsScreenProps) {
  const chartData = (goal?.history ?? []).map((entry) => ({
    label: new Date(entry.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    value: entry.value,
  }))

  const historyDescending = [...(goal?.history ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Calcula o domínio do eixo Y baseado em inicial e meta
  const yAxisDomain = goal
    ? (() => {
        const startValue = goal.startValue ?? 0
        const targetValue = goal.targetValue

        // Se meta > inicial (ex: carga): min = inicial, max = meta
        // Se meta < inicial (ex: tempo): min = meta, max = inicial
        const minValue = Math.min(startValue, targetValue)
        const maxValue = Math.max(startValue, targetValue)

        // Adiciona 10% de padding para melhor visualização
        const padding = (maxValue - minValue) * 0.1
        return [Math.floor(minValue - padding), Math.ceil(maxValue + padding)]
      })()
    : [0, 100]

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar
        position="relative"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={onClose}>
            <Close />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Histórico
          </Typography>
          <IconButton onClick={onDelete} disabled={!goal} color="error">
            <Delete />
          </IconButton>
          <Button startIcon={<Edit />} onClick={onEdit} disabled={!goal}>
            Editar
          </Button>
          {goal?.status === 'active' && (
            <Button
              variant="contained"
              startIcon={<Done />}
              color="primary"
              onClick={onMarkAsCompleted}
              sx={{ ml: 2 }}
            >
              Concluir
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, pb: 12 }}>
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Carregando dados da meta...
          </Typography>
        )}

        {!loading && goal && (
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {goal.title}
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
                  <Box>
                    <Typography
                      variant="caption"
                      color="info.main"
                      fontWeight={700}
                      textTransform="uppercase"
                    >
                      Inicial
                    </Typography>
                    <Typography variant="subtitle1">
                      {formatValueByUnit(goal.startValue ?? 0, goal.unit)} {goal.unit}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Meta
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {formatValueByUnit(goal.targetValue, goal.unit)} {goal.unit}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Atual
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {formatValueByUnit(goal.currentValue ?? goal.startValue ?? 0, goal.unit)}{' '}
                      {goal.unit}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Alvo
                    </Typography>
                    <Typography variant="subtitle1">{formatDate(goal.targetDate)}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {goal.strategyNotes && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Estratégia
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {goal.strategyNotes}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Evolução
                </Typography>
                {chartData.length >= 2 ? (
                  <Box sx={{ height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={chartData}
                        margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          domain={yAxisDomain}
                          tickFormatter={(value) =>
                            goal ? formatValueByUnit(value, goal.unit) : value
                          }
                        />
                        <Tooltip
                          formatter={(value: number) =>
                            `${formatValueByUnit(value, goal.unit)} ${goal.unit}`
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#FF6A3D"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Cadastre pelo menos duas atualizações para visualizar o gráfico.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight="bold">
                Histórico de Atualizações
              </Typography>
              {historyDescending.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma atualização registrada ainda.
                </Typography>
              )}
              {historyDescending.map((entry) => (
                <Card key={entry.id} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {formatValueByUnit(entry.value, goal.unit)} {goal.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </Typography>
                    {entry.notes && (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {entry.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          position: 'fixed',
          bottom: 80,
          left: 0,
          right: 0,
          px: 3,
        }}
      >
        <Stack spacing={2}>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            size="large"
            sx={{ borderRadius: 999 }}
            onClick={onUpdateProgress}
            disabled={!goal || goal.status !== 'active'}
          >
            Atualizar Progresso
          </Button>
          {goal?.status === 'active' && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Dica: Atualize o progresso antes de concluir para registrar o valor final no gráfico
            </Typography>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
