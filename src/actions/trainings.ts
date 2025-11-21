'use server'

import { prisma } from '@/lib/prisma'
import type { TrainingData, TrainingDetail, TrainingSummary } from '@/types/training'
import { revalidatePath } from 'next/cache'
import { getTrainingModelById } from './trainingModels'

/**
 * Buscar todos os treinos com informações resumidas
 */
export async function getAllTrainings(): Promise<TrainingSummary[]> {
  const trainings = await prisma.training.findMany({
    include: {
      sport: {
        select: {
          name: true,
        },
      },
      model: {
        select: {
          name: true,
        },
      },
      participants: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              photo: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  })

  return trainings.map((training) => {
    const data = training.data as TrainingData | null
    const isActive = data && !data.endTime
    const firstParticipant = training.participants[0]?.athlete

    return {
      id: training.id,
      date: training.date,
      athleteId: firstParticipant?.id || 0,
      athleteName: firstParticipant?.name || 'Sem participantes',
      athletePhoto: firstParticipant?.photo || undefined,
      participants: training.participants.map((p) => ({
        id: p.athlete.id,
        name: p.athlete.name,
        photo: p.athlete.photo || undefined,
      })),
      modelName: training.model?.name,
      sportName: training.sport.name,
      duration: data?.duration,
      status: isActive ? 'active' : 'completed',
    }
  })
}

/**
 * Buscar detalhes de um treino específico
 */
export async function getTrainingById(id: number): Promise<TrainingDetail | null> {
  const training = await prisma.training.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              photo: true,
            },
          },
        },
      },
    },
  })

  if (!training) return null

  const firstParticipant = training.participants[0]?.athlete

  return {
    id: training.id,
    date: training.date,
    notes: training.notes || undefined,
    data: training.data as unknown as TrainingData,
    athlete: firstParticipant
      ? {
          id: firstParticipant.id,
          name: firstParticipant.name,
          photo: firstParticipant.photo || undefined,
        }
      : {
          id: 0,
          name: 'Sem participantes',
          photo: undefined,
        },
    participants: training.participants.map((p) => ({
      id: p.athlete.id,
      name: p.athlete.name,
      photo: p.athlete.photo || undefined,
    })),
    createdAt: training.createdAt,
    updatedAt: training.updatedAt,
  }
}

/**
 * Criar um novo treino (snapshot do modelo)
 */
export async function createTraining(data: { athleteIds: number[]; modelId: number; date?: Date }) {
  if (!data.athleteIds || data.athleteIds.length === 0) {
    throw new Error('É necessário selecionar pelo menos um atleta')
  }

  // Buscar o modelo completo
  const model = await getTrainingModelById(data.modelId)
  if (!model) {
    throw new Error('Modelo de treino não encontrado')
  }

  // Criar snapshot da estrutura do modelo
  const snapshot = {
    modelId: model.id,
    modelName: model.name,
    sportId: model.sportId,
    sportName: model.sport.name,
    fields: model.fields,
  }

  const trainingData: TrainingData = {
    snapshot,
    values: {},
    startTime: new Date().toISOString(),
  }

  // Criar treino
  const training = await prisma.training.create({
    data: {
      date: data.date || new Date(),
      modelId: data.modelId,
      sportId: model.sportId,
      data: trainingData as any,
      participants: {
        create: data.athleteIds.map((athleteId) => ({
          athleteId,
          status: 'present',
        })),
      },
    },
    include: {
      sport: true,
      model: true,
      participants: {
        include: {
          athlete: true,
        },
      },
    },
  })

  revalidatePath('/dashboard/trainings')
  return training.id
}

/**
 * Atualizar dados do treino em andamento
 */
export async function updateTrainingData(
  id: number,
  values: Record<string, any>,
  notes?: string,
  athleteValues?: Record<number, Record<string, any>>
) {
  const training = await prisma.training.findUnique({
    where: { id },
  })

  if (!training) {
    throw new Error('Treino não encontrado')
  }

  const currentData = training.data as unknown as TrainingData

  const updatedData: TrainingData = {
    ...currentData,
    values,
    athleteValues: athleteValues || currentData.athleteValues,
  }

  await prisma.training.update({
    where: { id },
    data: {
      data: updatedData as any,
      notes: notes || training.notes,
    },
  })

  revalidatePath('/dashboard/trainings')
  revalidatePath(`/dashboard/trainings/${id}`)
}

/**
 * Finalizar treino
 */
export async function finishTraining(
  id: number,
  values: Record<string, any>,
  notes?: string,
  customDuration?: number,
  customStartTime?: Date,
  customEndTime?: Date,
  athleteValues?: Record<number, Record<string, any>>
) {
  const training = await prisma.training.findUnique({
    where: { id },
  })

  if (!training) {
    throw new Error('Treino não encontrado')
  }

  const currentData = training.data as unknown as TrainingData

  // Usar valores customizados se fornecidos, caso contrário usar cronômetro
  const endTime = customEndTime || new Date()
  const startTime = customStartTime || new Date(currentData.startTime)
  const duration =
    customDuration !== undefined
      ? customDuration
      : Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

  const finalData: TrainingData = {
    ...currentData,
    values,
    athleteValues: athleteValues || currentData.athleteValues,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration,
  }

  await prisma.training.update({
    where: { id },
    data: {
      date: startTime, // Atualizar a data do treino com o horário de início customizado
      data: finalData as any,
      notes: notes || training.notes,
    },
  })

  revalidatePath('/dashboard/trainings')
  revalidatePath(`/dashboard/trainings/${id}`)
}

/**
 * Deletar treino
 */
export async function deleteTraining(id: number) {
  await prisma.training.delete({
    where: { id },
  })

  revalidatePath('/dashboard/trainings')
}
