'use client'

import { getGoalsReport } from '@/actions/reports'
import { exportGoalsReportToPDF } from '@/utils/exportPDF'
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle,
  Error as ErrorIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import useSWR from 'swr'

// Fetcher function for athletes
const fetchAthletes = async () => {
  const response = await fetch('/api/athletes')
  if (!response.ok) throw new Error('Failed to fetch athletes')
  return response.json()
}

interface GoalsReportScreenProps {
  onBack?: () => void
}

const STATUS_COLORS = {
  active: '#2196f3',
  completed: '#4caf50',
  expired: '#f44336',
}

const STATUS_LABELS = {
  active: 'Em Andamento',
  completed: 'Concluída',
  expired: 'Expirada',
}

export function GoalsReportScreen({ onBack }: GoalsReportScreenProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: athletes } = useSWR('athletes', fetchAthletes)

  const { data: reportData, isLoading } = useSWR(
    ['goals-report', selectedAthleteId, selectedStatus, startDate, endDate],
    () =>
      getGoalsReport({
        athleteId: selectedAthleteId || undefined,
        status: selectedStatus === 'all' ? undefined : (selectedStatus as any),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
  )

  const handleExportPDF = () => {
    if (!reportData) {
      alert('Não há dados para exportar')
      return
    }

    setIsExporting(true)

    try {
      const filename = `relatorio-metas-${format(new Date(), 'dd-MM-yyyy')}.pdf`
      exportGoalsReportToPDF(reportData, filename)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar PDF. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearFilters = () => {
    setSelectedAthleteId(null)
    setSelectedStatus('all')
    setStartDate('')
    setEndDate('')
  }

  // Dados para o gráfico de pizza
  const pieData = reportData
    ? [
        { name: 'Em Andamento', value: reportData.statistics.active, color: STATUS_COLORS.active },
        {
          name: 'Concluídas',
          value: reportData.statistics.completed,
          color: STATUS_COLORS.completed,
        },
        { name: 'Expiradas', value: reportData.statistics.expired, color: STATUS_COLORS.expired },
      ].filter((item) => item.value > 0)
    : []

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Estilos para modo de exportação PDF */}
      <style>
        {`
          .pdf-export-mode * {
            color: #000000 !important;
          }
          .pdf-export-mode .MuiChip-root {
            background-color: #e0e0e0 !important;
          }
          .pdf-export-mode .MuiChip-colorSuccess {
            background-color: #4caf50 !important;
            color: #ffffff !important;
          }
          .pdf-export-mode .MuiChip-colorError {
            background-color: #f44336 !important;
            color: #ffffff !important;
          }
          .pdf-export-mode .MuiChip-colorWarning {
            background-color: #ff9800 !important;
            color: #ffffff !important;
          }
          .pdf-export-mode .MuiChip-colorPrimary {
            background-color: #2196f3 !important;
            color: #ffffff !important;
          }
          .pdf-export-mode .MuiLinearProgress-bar {
            background-color: #2196f3 !important;
          }
          .pdf-export-mode .MuiCard-root {
            background-color: #ffffff !important;
            border: 1px solid #e0e0e0 !important;
          }
        `}
      </style>

      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Relatório de Metas
          </Typography>
          <Button
            color="inherit"
            startIcon={isExporting ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
            onClick={handleExportPDF}
            disabled={isExporting || !reportData}
          >
            Exportar PDF
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
        {/* Filtros */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filtros
            </Typography>
            <Stack spacing={2}>
              <TextField
                select
                label="Atleta"
                value={selectedAthleteId || ''}
                onChange={(e) =>
                  setSelectedAthleteId(e.target.value ? Number(e.target.value) : null)
                }
                fullWidth
                size="small"
              >
                <MenuItem value="">Todos os atletas</MenuItem>
                {athletes?.map((athlete: any) => (
                  <MenuItem key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Em Andamento</MenuItem>
                <MenuItem value="completed">Concluídas</MenuItem>
                <MenuItem value="expired">Expiradas</MenuItem>
              </TextField>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Data Inicial"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Data Final"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>

              <Button variant="outlined" onClick={handleClearFilters} size="small">
                Limpar Filtros
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Conteúdo do Relatório (para exportar) */}
        <Box
          id="goals-report-content"
          sx={{
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
          }}
        >
          {/* Cabeçalho do Relatório */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
              Relatório de Metas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reportData ? (
            <>
              {/* Estatísticas Gerais */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Resumo Geral
                </Typography>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total de Metas
                      </Typography>
                      <Typography variant="h4">{reportData.statistics.total}</Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Em Andamento
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {reportData.statistics.active}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Concluídas
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {reportData.statistics.completed}
                      </Typography>
                    </CardContent>
                  </Card>
                  {reportData.statistics.nearDeadline > 0 && (
                    <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Próximas do Prazo
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {reportData.statistics.nearDeadline}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </Box>

              {/* Gráfico de Pizza */}
              {pieData.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Distribuição por Status
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}

              {/* Tabela de Metas */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Detalhamento das Metas
                </Typography>
                {reportData.goals.length === 0 ? (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    Nenhuma meta encontrada com os filtros aplicados
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Atleta</TableCell>
                          <TableCell>Meta</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="center">Progresso</TableCell>
                          <TableCell align="right">Atual</TableCell>
                          <TableCell align="right">Alvo</TableCell>
                          <TableCell align="center">Prazo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.goals.map((goal) => (
                          <TableRow key={goal.id}>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar src={goal.athlete.photo} sx={{ width: 32, height: 32 }}>
                                  {goal.athlete.name.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">{goal.athlete.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                {goal.title}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={STATUS_LABELS[goal.status as keyof typeof STATUS_LABELS]}
                                size="small"
                                color={
                                  goal.status === 'completed'
                                    ? 'success'
                                    : goal.status === 'expired'
                                      ? 'error'
                                      : 'primary'
                                }
                                icon={
                                  goal.status === 'completed' ? (
                                    <CheckCircle />
                                  ) : goal.isOverdue ? (
                                    <ErrorIcon />
                                  ) : goal.isNearDeadline ? (
                                    <WarningIcon />
                                  ) : (
                                    <ScheduleIcon />
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ width: 100 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box sx={{ flex: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={goal.progress}
                                      color={
                                        goal.progress >= 100
                                          ? 'success'
                                          : goal.progress >= 50
                                            ? 'primary'
                                            : 'warning'
                                      }
                                    />
                                  </Box>
                                  <Typography variant="caption">{goal.progress}%</Typography>
                                </Stack>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {goal.currentValue} {goal.unit}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {goal.targetValue} {goal.unit}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {goal.targetDate ? (
                                <Typography variant="caption">
                                  {format(new Date(goal.targetDate), 'dd/MM/yyyy')}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Sem prazo
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Erro ao carregar relatório
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}
