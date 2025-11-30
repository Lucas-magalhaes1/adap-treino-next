import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// =============================================
// TYPES
// =============================================

interface GoalReportData {
  statistics: {
    total: number
    active: number
    completed: number
    expired: number
    nearDeadline: number
  }
  goals: Array<{
    id: number
    title: string
    status: string
    progress: number
    currentValue: number
    targetValue: number
    unit: string
    targetDate: string | null
    athlete: {
      name: string
    }
  }>
}

interface FrequencyReportData {
  period: {
    startDate: string
    endDate: string
  }
  statistics: {
    totalTrainings: number
    activeAthletes: number
    totalAthletes: number
    averageTrainingsPerAthlete: number
    lowFrequencyCount: number
    periodDays: number
  }
  athletes: Array<{
    id: number
    name: string
    trainingCount: number
    avgPerWeek: number
    avgPerMonth: number
    lowFrequency: boolean
    sportsCount: number
  }>
}

// =============================================
// HELPERS
// =============================================

function addHeader(pdf: jsPDF, title: string, subtitle?: string) {
  const pageWidth = pdf.internal.pageSize.getWidth()

  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text(title, pageWidth / 2, 20, { align: 'center' })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100)
  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  pdf.text(`Gerado em ${dateStr}`, pageWidth / 2, 28, { align: 'center' })

  if (subtitle) {
    pdf.text(subtitle, pageWidth / 2, 34, { align: 'center' })
  }

  pdf.setTextColor(0)
}

function addSectionTitle(pdf: jsPDF, title: string, y: number): number {
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text(title, 14, y)
  return y + 8
}

function addStatsRow(
  pdf: jsPDF,
  stats: Array<{ label: string; value: string | number }>,
  y: number
): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const colWidth = (pageWidth - 28) / stats.length

  pdf.setFontSize(9)

  stats.forEach((stat, i) => {
    const x = 14 + i * colWidth

    // Label
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100)
    pdf.text(stat.label, x, y)

    // Value
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0)
    pdf.setFontSize(14)
    pdf.text(String(stat.value), x, y + 6)
    pdf.setFontSize(9)
  })

  return y + 16
}

// =============================================
// EXPORT FUNCTIONS
// =============================================

export function exportGoalsReportToPDF(data: GoalReportData, filename: string) {
  const pdf = new jsPDF('p', 'mm', 'a4')

  // Header
  addHeader(pdf, 'Relatório de Metas')

  // Stats
  let y = 45
  y = addSectionTitle(pdf, 'Resumo', y)
  y = addStatsRow(
    pdf,
    [
      { label: 'Total', value: data.statistics.total },
      { label: 'Em Andamento', value: data.statistics.active },
      { label: 'Concluídas', value: data.statistics.completed },
      { label: 'Expiradas', value: data.statistics.expired },
    ],
    y
  )

  // Table
  y += 5
  y = addSectionTitle(pdf, 'Detalhamento das Metas', y)

  const tableData = data.goals.map((goal) => [
    goal.athlete.name,
    goal.title,
    goal.status === 'completed'
      ? 'Concluída'
      : goal.status === 'expired'
        ? 'Expirada'
        : 'Em Andamento',
    `${goal.progress}%`,
    `${goal.currentValue} ${goal.unit}`,
    `${goal.targetValue} ${goal.unit}`,
    goal.targetDate ? format(new Date(goal.targetDate), 'dd/MM/yyyy') : '-',
  ])

  autoTable(pdf, {
    startY: y,
    head: [['Atleta', 'Meta', 'Status', 'Progresso', 'Atual', 'Alvo', 'Prazo']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22 },
    },
  })

  pdf.save(filename)
}

export function exportFrequencyReportToPDF(data: FrequencyReportData, filename: string) {
  const pdf = new jsPDF('p', 'mm', 'a4')

  // Header
  const periodStr = `${format(new Date(data.period.startDate), 'dd/MM/yyyy')} até ${format(new Date(data.period.endDate), 'dd/MM/yyyy')} (${data.statistics.periodDays} dias)`
  addHeader(pdf, 'Relatório de Frequência de Treinos', `Período: ${periodStr}`)

  // Stats
  let y = 50
  y = addSectionTitle(pdf, 'Estatísticas', y)
  y = addStatsRow(
    pdf,
    [
      { label: 'Total Treinos', value: data.statistics.totalTrainings },
      {
        label: 'Atletas Ativos',
        value: `${data.statistics.activeAthletes}/${data.statistics.totalAthletes}`,
      },
      { label: 'Média/Atleta', value: data.statistics.averageTrainingsPerAthlete },
      { label: 'Baixa Frequência', value: data.statistics.lowFrequencyCount },
    ],
    y
  )

  // Table
  y += 5
  y = addSectionTitle(pdf, 'Detalhamento por Atleta', y)

  const tableData = data.athletes.map((athlete) => [
    athlete.name,
    String(athlete.trainingCount),
    String(athlete.avgPerWeek),
    String(athlete.avgPerMonth),
    String(athlete.sportsCount),
    athlete.trainingCount === 0 ? 'Inativo' : athlete.lowFrequency ? 'Baixa Frequência' : 'Ativo',
  ])

  autoTable(pdf, {
    startY: y,
    head: [['Atleta', 'Total Treinos', 'Média/Semana', 'Média/Mês', 'Esportes', 'Status']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didParseCell: (data) => {
      // Colorir status
      if (data.column.index === 5 && data.section === 'body') {
        const value = data.cell.raw as string
        if (value === 'Inativo') {
          data.cell.styles.textColor = [244, 67, 54]
          data.cell.styles.fontStyle = 'bold'
        } else if (value === 'Baixa Frequência') {
          data.cell.styles.textColor = [255, 152, 0]
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [76, 175, 80]
        }
      }
    },
  })

  // Warning if there are low frequency athletes
  if (data.statistics.lowFrequencyCount > 0) {
    const finalY = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    pdf.setFillColor(255, 243, 224)
    pdf.roundedRect(14, finalY, pdf.internal.pageSize.getWidth() - 28, 20, 2, 2, 'F')

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 152, 0)
    pdf.text(
      `⚠ Atenção: ${data.statistics.lowFrequencyCount} atleta(s) com baixa frequência`,
      18,
      finalY + 7
    )

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100)
    pdf.setFontSize(8)
    pdf.text(
      'Atletas com menos de 1 treino por semana podem estar em risco de evasão.',
      18,
      finalY + 14
    )
  }

  pdf.save(filename)
}
