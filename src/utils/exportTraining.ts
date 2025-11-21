import type { TrainingDetail } from '@/types/training'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Converte dados de treino para CSV
 */
export function exportTrainingToCSV(training: TrainingDetail): void {
  const rows: string[][] = []

  // Cabeçalho
  rows.push(['Informações do Treino'])
  rows.push([
    'Atletas',
    training.participants.length === 1
      ? training.participants[0].name
      : training.participants.map((p) => p.name).join(', '),
  ])
  rows.push(['Data', format(new Date(training.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })])
  rows.push(['Modelo', training.data.snapshot.modelName])
  rows.push(['Esporte', training.data.snapshot.sportName])

  if (training.data.duration) {
    const hours = Math.floor(training.data.duration / 3600000)
    const minutes = Math.floor((training.data.duration % 3600000) / 60000)
    const seconds = Math.floor((training.data.duration % 60000) / 1000)
    rows.push(['Duração', `${hours}h ${minutes}m ${seconds}s`])
  }

  if (training.participants.length > 0) {
    rows.push(['Participantes', training.participants.map((p) => p.name).join(', ')])
  }

  if (training.notes) {
    rows.push(['Observações', training.notes])
  }

  rows.push([]) // Linha vazia

  // Valores dos campos
  rows.push(['Campos do Treino'])
  rows.push(['Campo', 'Valor'])

  const extractFieldValues = (fields: any[], values: Record<string, any>, prefix = '') => {
    fields.forEach((field) => {
      const value = values[field.key]
      const label = prefix + field.label

      if (value !== undefined && value !== null && value !== '') {
        if (field.fieldType === 'multiple-choice' && Array.isArray(value)) {
          rows.push([label, value.join(', ')])
        } else if (field.fieldType === 'boolean' || field.fieldType === 'expandable-boolean') {
          rows.push([label, value ? 'Sim' : 'Não'])
        } else if (field.fieldType === 'number') {
          rows.push([label, `${value}${field.unit ? ` ${field.unit}` : ''}`])
        } else if (field.fieldType === 'group') {
          rows.push([label, ''])
          if (field.children && field.children.length > 0) {
            extractFieldValues(field.children, values, `${prefix}  `)
          }
        } else {
          rows.push([label, String(value)])
        }
      }

      // Processar campos filhos (para expandable-boolean e group)
      if (field.children && field.children.length > 0) {
        if (field.fieldType === 'expandable-boolean' && value === true) {
          extractFieldValues(field.children, values, `${prefix}  `)
        }
      }
    })
  }

  extractFieldValues(training.data.snapshot.fields, training.data.values)

  // Converter para CSV
  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const athleteName =
    training.participants.length === 1 ? training.participants[0].name : 'multiplos-atletas'
  link.download = `treino-${athleteName}-${format(new Date(training.date), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Converte dados de treino para PDF (simplificado via window.print)
 */
export function exportTrainingToPDF(): void {
  window.print()
}

/**
 * Exporta múltiplos treinos para CSV consolidado
 */
export function exportMultipleTrainingsToCSV(trainings: TrainingDetail[]): void {
  const rows: string[][] = []

  // Cabeçalho
  rows.push(['Data', 'Atletas', 'Modelo', 'Esporte', 'Duração', 'Status', 'Observações'])

  // Linhas de dados
  trainings.forEach((training) => {
    let duration = ''
    if (training.data.duration) {
      const hours = Math.floor(training.data.duration / 3600000)
      const minutes = Math.floor((training.data.duration % 3600000) / 60000)
      duration = `${hours}h ${minutes}m`
    }

    const athleteNames =
      training.participants.length === 1
        ? training.participants[0].name
        : training.participants.map((p) => p.name).join('; ')

    rows.push([
      format(new Date(training.date), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      athleteNames,
      training.data.snapshot.modelName,
      training.data.snapshot.sportName,
      duration,
      training.data.endTime ? 'Finalizado' : 'Ativo',
      training.notes || '',
    ])
  })

  // Converter para CSV
  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `treinos-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
