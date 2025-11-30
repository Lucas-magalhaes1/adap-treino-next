'use client'

import { getTrainingFrequencyReport } from '@/actions/reports'
import { exportFrequencyReportToPDF } from '@/utils/exportPDF'
import {
  PictureAsPdf as PictureAsPdfIcon,
  TrendingDown as TrendingDownIcon,
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
  useColorScheme,
} from '@mui/material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import useSWR from 'swr'

// Fetcher functions
const fetchAthleteGroups = async () => {
  const response = await fetch('/api/athlete-groups')
  if (!response.ok) throw new Error('Failed to fetch groups')
  const result = await response.json()
  return result.data || []
}

const fetchSports = async () => {
  const response = await fetch('/api/sports')
  if (!response.ok) throw new Error('Failed to fetch sports')
  const result = await response.json()
  return result.data || []
}

interface TrainingFrequencyReportScreenProps {
  onBack?: () => void
}

export function TrainingFrequencyReportScreen({}: TrainingFrequencyReportScreenProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { mode, setMode } = useColorScheme()

  const { data: groups } = useSWR('athlete-groups', fetchAthleteGroups)
  const { data: sports } = useSWR('sports', fetchSports)

  const { data: reportData, isLoading } = useSWR(
    ['training-frequency-report', selectedSportId, selectedGroupId, startDate, endDate],
    () =>
      getTrainingFrequencyReport({
        sportId: selectedSportId || undefined,
        groupId: selectedGroupId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
  )

  useEffect(() => {
    if (mode !== 'light') {
      setMode('light')
    }
  }, [mode, setMode])

  const handleExportPDF = () => {
    if (!reportData) {
      alert('Não há dados para exportar')
      return
    }

    setIsExporting(true)

    try {
      const filename = `relatorio-frequencia-${format(new Date(), 'dd-MM-yyyy')}.pdf`
      exportFrequencyReportToPDF(reportData, filename)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao exportar PDF. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearFilters = () => {
    setSelectedSportId(null)
    setSelectedGroupId(null)
    setStartDate('')
    setEndDate('')
  }

  // Dados para o gráfico de barras (top 10 atletas)
  const chartData =
    reportData?.athletes.slice(0, 10).map((athlete) => ({
      name: athlete.name.split(' ')[0], // Apenas primeiro nome para caber no gráfico
      treinos: athlete.trainingCount,
      média: athlete.avgPerWeek,
    })) || []

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
          .pdf-export-mode .MuiChip-colorWarning {
            background-color: #ff9800 !important;
            color: #ffffff !important;
          }
          .pdf-export-mode .MuiChip-colorError {
            background-color: #f44336 !important;
            color: #ffffff !important;
          }
          .pdf-export-mode .MuiCard-root {
            background-color: #ffffff !important;
            border: 1px solid #e0e0e0 !important;
          }
        `}
      </style>

      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Relatório de Frequência de Treinos
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
                label="Esporte"
                value={selectedSportId || ''}
                onChange={(e) => setSelectedSportId(e.target.value ? Number(e.target.value) : null)}
                fullWidth
                size="small"
              >
                <MenuItem value="">Todos os esportes</MenuItem>
                {sports?.map((sport: any) => (
                  <MenuItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Grupo"
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
                fullWidth
                size="small"
              >
                <MenuItem value="">Todos os grupos</MenuItem>
                {groups?.map((group: any) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Data Início"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Data Fim"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
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
          id="frequency-report-content"
          sx={{
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
          }}
        >
          {/* Cabeçalho do Relatório */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
              Relatório de Frequência de Treinos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Typography>
            {reportData && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Período: {format(new Date(reportData.period.startDate), 'dd/MM/yyyy')} até{' '}
                {format(new Date(reportData.period.endDate), 'dd/MM/yyyy')} (
                {reportData.statistics.periodDays} dias)
              </Typography>
            )}
          </Box>

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reportData ? (
            <>
              {/* Cards de Estatísticas */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total de Treinos
                    </Typography>
                    <Typography variant="h4">{reportData.statistics.totalTrainings}</Typography>
                  </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Atletas Ativos
                    </Typography>
                    <Typography variant="h4">{reportData.statistics.activeAthletes}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      de {reportData.statistics.totalAthletes} atletas
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Média por Atleta
                    </Typography>
                    <Typography variant="h4">
                      {reportData.statistics.averageTrainingsPerAthlete}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      treinos no período
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    flex: 1,
                    bgcolor:
                      reportData.statistics.lowFrequencyCount > 0 ? 'warning.light' : undefined,
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Baixa Frequência
                    </Typography>
                    <Typography variant="h4">{reportData.statistics.lowFrequencyCount}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {'<'} 1 treino/semana
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>

              {/* Gráfico de Barras */}
              {chartData.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Top 10 Atletas - Quantidade de Treinos
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="treinos" fill="#2196f3" name="Treinos Realizados" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}

              {/* Tabela de Atletas */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Detalhamento por Atleta
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Atleta</TableCell>
                        <TableCell align="center">Total Treinos</TableCell>
                        <TableCell align="center">Média/Semana</TableCell>
                        <TableCell align="center">Média/Mês</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.athletes.map((athlete) => (
                        <TableRow key={athlete.id}>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar src={athlete.photo} alt={athlete.name}>
                                {athlete.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {athlete.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {athlete.sportsCount} esporte(s)
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="h6">{athlete.trainingCount}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{athlete.avgPerWeek}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{athlete.avgPerMonth}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            {athlete.lowFrequency ? (
                              <Chip
                                icon={<WarningIcon />}
                                label="Baixa Frequência"
                                color="warning"
                                size="small"
                              />
                            ) : athlete.trainingCount === 0 ? (
                              <Chip
                                icon={<TrendingDownIcon />}
                                label="Inativo"
                                color="error"
                                size="small"
                              />
                            ) : (
                              <Chip label="Ativo" color="success" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Alerta de Baixa Frequência */}
              {reportData.statistics.lowFrequencyCount > 0 && (
                <Card sx={{ mt: 3, bgcolor: 'warning.light' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <WarningIcon color="warning" />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Atenção: {reportData.statistics.lowFrequencyCount} atleta(s) com baixa
                          frequência
                        </Typography>
                        <Typography variant="body2">
                          Atletas com menos de 1 treino por semana podem estar em risco de evasão.
                          Considere entrar em contato para entender possíveis dificuldades.
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Nenhum dado disponível para o período selecionado
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
