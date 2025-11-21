'use server'

import prisma from '@/lib/prisma'

export interface PersonalRecordCheck {
  fieldKey: string
  fieldLabel: string
  newValue: number
  isNewRecord: boolean
  previousRecord?: number
  unit?: string
}

/**
 * Verifica se os valores de um treino estabeleceram novos recordes pessoais
 * @param athleteId ID do atleta
 * @param modelId ID do modelo de treino
 * @param values Valores preenchidos no treino {fieldKey: value}
 * @param modelFields Campos do modelo (para pegar labels e units)
 * @returns Array com informações sobre recordes (novos ou não)
 */
export async function checkPersonalRecords(
  athleteId: number,
  modelId: number,
  values: Record<string, any>,
  modelFields: Array<{
    key: string
    label: string
    fieldType: string
    unit?: string
  }>
): Promise<PersonalRecordCheck[]> {
  const results: PersonalRecordCheck[] = []

  // Filtrar apenas campos numéricos com valores preenchidos
  const numericValues = Object.entries(values).filter(([key, value]) => {
    const field = modelFields.find((f) => f.key === key)
    return field?.fieldType === 'number' && typeof value === 'number' && !isNaN(value)
  })

  for (const [fieldKey, newValue] of numericValues) {
    const field = modelFields.find((f) => f.key === fieldKey)
    if (!field) continue

    // Buscar todos os treinos anteriores do atleta com este modelo
    const previousTrainings = await prisma.training.findMany({
      where: {
        modelId,
        participants: {
          some: {
            athleteId,
          },
        },
      },
      select: {
        data: true,
      },
    })

    // Extrair valores históricos deste campo (apenas de treinos finalizados)
    const historicalValues: number[] = []
    for (const training of previousTrainings) {
      const trainingData = training.data as any
      // Verificar se o treino foi finalizado (tem endTime)
      if (!trainingData?.endTime) continue

      const fieldValue = trainingData?.values?.[fieldKey]
      if (typeof fieldValue === 'number' && !isNaN(fieldValue)) {
        historicalValues.push(fieldValue)
      }
    }

    // Determinar se é novo recorde
    let isNewRecord = false
    let previousRecord: number | undefined

    if (historicalValues.length > 0) {
      previousRecord = Math.max(...historicalValues)
      isNewRecord = newValue > previousRecord
    } else {
      // Primeiro treino com este campo = primeiro recorde
      isNewRecord = true
    }

    results.push({
      fieldKey,
      fieldLabel: field.label,
      newValue: Number(newValue),
      isNewRecord,
      previousRecord,
      unit: field.unit,
    })
  }

  return results
}

/**
 * Salva um recorde pessoal na tabela PersonalRecord
 */
export async function savePersonalRecord(
  athleteId: number,
  title: string,
  value: number,
  unit?: string,
  trainingId?: number
): Promise<void> {
  await prisma.personalRecord.create({
    data: {
      athleteId,
      title,
      value: value.toString(),
      unit: unit || '',
      dateAchieved: new Date(),
      trainingId: trainingId || null,
    },
  })
}
