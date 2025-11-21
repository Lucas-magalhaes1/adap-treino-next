'use server'

import { prisma } from '@/lib/prisma'
import type { TrainingData } from '@/types/training'

export interface ProgressionDataPoint {
  date: Date
  value: number
}

export interface FieldStatistics {
  fieldKey: string
  fieldLabel: string
  fieldUnit?: string
  average: number
  min: number
  max: number
  trend: 'up' | 'down' | 'stable'
  improvementPercentage: number
}

/**
 * Buscar dados de progressão para um campo específico
 */
export async function getFieldProgression(
  athleteId: number,
  modelId: number,
  fieldKey: string,
  periodDays: number = 90
): Promise<ProgressionDataPoint[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  const trainings = await prisma.training.findMany({
    where: {
      participants: {
        some: {
          athleteId,
        },
      },
      modelId: modelId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      id: true,
      date: true,
      data: true,
    },
  })

  // Extrair valores do campo específico
  const dataPoints = trainings
    .map((t) => {
      const data = t.data as unknown as TrainingData
      const value = data?.values?.[fieldKey]

      if (value === undefined || value === null || typeof value !== 'number') {
        return null
      }

      return {
        date: t.date,
        value: value,
      }
    })
    .filter((d): d is ProgressionDataPoint => d !== null)

  return dataPoints
}

/**
 * Calcular estatísticas de um campo
 */
export async function getFieldStatistics(
  athleteId: number,
  modelId: number,
  fieldKey: string,
  fieldLabel: string,
  fieldUnit?: string,
  periodDays: number = 90
): Promise<FieldStatistics | null> {
  const dataPoints = await getFieldProgression(athleteId, modelId, fieldKey, periodDays)

  if (dataPoints.length === 0) {
    return null
  }

  const values = dataPoints.map((d) => d.value)
  const average = values.reduce((sum, v) => sum + v, 0) / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)

  // Calcular tendência (comparar primeira metade vs segunda metade)
  const midPoint = Math.floor(dataPoints.length / 2)
  const firstHalfAvg = dataPoints.slice(0, midPoint).reduce((sum, d) => sum + d.value, 0) / midPoint
  const secondHalfAvg =
    dataPoints.slice(midPoint).reduce((sum, d) => sum + d.value, 0) / (dataPoints.length - midPoint)

  const improvementPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (improvementPercentage > 5) trend = 'up'
  else if (improvementPercentage < -5) trend = 'down'

  return {
    fieldKey,
    fieldLabel,
    fieldUnit,
    average,
    min,
    max,
    trend,
    improvementPercentage,
  }
}

/**
 * Buscar modelos de treino usados por um atleta
 */
export async function getAthleteTrainingModels(athleteId: number) {
  const models = await prisma.training.findMany({
    where: {
      participants: {
        some: {
          athleteId,
        },
      },
      modelId: { not: null },
    },
    select: {
      model: {
        select: {
          id: true,
          name: true,
          sport: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    distinct: ['modelId'],
  })

  return models.map((m) => m.model).filter((m): m is NonNullable<typeof m> => m !== null)
}
