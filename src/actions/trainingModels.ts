'use server'

import prisma from '@/lib/prisma'
import type {
  TrainingModelDetail,
  TrainingModelField,
  TrainingModelSummary,
} from '@/types/trainingModel'
import { revalidatePath } from 'next/cache'

// Buscar todos os modelos de treino (resumo)
export async function getTrainingModels(): Promise<TrainingModelSummary[]> {
  const models = await prisma.trainingModel.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      sport: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          fields: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return models.map((model) => ({
    id: model.id,
    name: model.name,
    description: model.description || undefined,
    sport: model.sport,
    _count: model._count,
  }))
}

// Buscar modelo de treino específico com campos
export async function getTrainingModelById(id: number): Promise<TrainingModelDetail | null> {
  const model = await prisma.trainingModel.findUnique({
    where: { id },
    include: {
      sport: {
        select: {
          id: true,
          name: true,
        },
      },
      fields: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  })

  if (!model) return null

  // Converter campos do banco para o formato esperado
  const fieldsWithConfig = model.fields.map((field) => ({
    id: field.id.toString(),
    key: field.key,
    label: field.label,
    fieldType: field.fieldType as TrainingModelField['fieldType'],
    unit: field.unit || undefined,
    sortOrder: field.sortOrder,
    isRequired: field.config ? (field.config as any).isRequired || false : false,
    config: field.config as TrainingModelField['config'],
    formType: (field.config as any)?.formType || 'general',
    parentId: field.parentId?.toString() || null,
  }))

  return {
    id: model.id,
    name: model.name,
    description: model.description || undefined,
    sportId: model.sportId,
    sport: model.sport,
    fields: fieldsWithConfig,
  }
}

// Criar novo modelo de treino
export async function createTrainingModel(data: {
  name: string
  description?: string
  sportId: number
}) {
  const model = await prisma.trainingModel.create({
    data: {
      name: data.name,
      description: data.description,
      sportId: data.sportId,
    },
  })

  revalidatePath('/dashboard/settings')
  return model
}

// Atualizar modelo de treino
export async function updateTrainingModel(
  id: number,
  data: {
    name?: string
    description?: string
    sportId?: number
  }
) {
  const model = await prisma.trainingModel.update({
    where: { id },
    data,
  })

  revalidatePath('/dashboard/settings')
  return model
}

// Deletar modelo de treino
export async function deleteTrainingModel(id: number) {
  await prisma.trainingModel.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })

  revalidatePath('/dashboard/settings')
}

// Criar campo do modelo
export async function createTrainingModelField(data: {
  trainingModelId: number
  key: string
  label: string
  fieldType: string
  unit?: string
  sortOrder: number
  isRequired: boolean
  formType: 'general' | 'athlete'
  parentId?: number | null // Para suportar hierarquia
  config?: any
}) {
  // Verificar se já existe um campo com essa key
  let uniqueKey = data.key
  let counter = 1

  while (true) {
    const existing = await prisma.trainingModelField.findUnique({
      where: {
        trainingModelId_key: {
          trainingModelId: data.trainingModelId,
          key: uniqueKey,
        },
      },
    })

    if (!existing) break

    // Se já existe, adicionar sufixo numérico
    uniqueKey = `${data.key}_${counter}`
    counter++
  }

  const field = await prisma.trainingModelField.create({
    data: {
      trainingModelId: data.trainingModelId,
      key: uniqueKey,
      label: data.label,
      fieldType: data.fieldType,
      unit: data.unit,
      sortOrder: data.sortOrder,
      parentId: data.parentId || null, // Suporte a hierarquia
      config: {
        isRequired: data.isRequired,
        formType: data.formType,
        ...data.config,
      },
    },
  })

  revalidatePath('/dashboard/settings')
  return field
}

// Atualizar campo do modelo
export async function updateTrainingModelField(
  id: number,
  data: {
    label?: string
    fieldType?: string
    unit?: string
    sortOrder?: number
    isRequired?: boolean
    formType?: 'general' | 'athlete'
    config?: any
  }
) {
  // Buscar campo atual para mesclar config
  const currentField = await prisma.trainingModelField.findUnique({
    where: { id },
  })

  if (!currentField) {
    throw new Error('Campo não encontrado')
  }

  const currentConfig = (currentField.config as any) || {}

  const field = await prisma.trainingModelField.update({
    where: { id },
    data: {
      ...(data.label && { label: data.label }),
      ...(data.fieldType && { fieldType: data.fieldType }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      config: {
        ...currentConfig,
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.formType && { formType: data.formType }),
        ...data.config,
      },
    },
  })

  revalidatePath('/dashboard/settings')
  return field
}

// Soft delete de campo
export async function deleteTrainingModelField(id: number) {
  await prisma.trainingModelField.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })

  revalidatePath('/dashboard/settings')
}

// Reordenar campos
export async function reorderTrainingModelFields(fields: { id: number; sortOrder: number }[]) {
  // Executar todas as atualizações em uma transação
  await prisma.$transaction(
    fields.map((field) =>
      prisma.trainingModelField.update({
        where: { id: field.id },
        data: { sortOrder: field.sortOrder },
      })
    )
  )

  revalidatePath('/dashboard/settings')
}

// Buscar todos os esportes (para o select)
export async function getAllSports() {
  return await prisma.sport.findMany({
    orderBy: {
      name: 'asc',
    },
  })
}
