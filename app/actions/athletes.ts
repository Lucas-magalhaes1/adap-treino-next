'use server'

import { prisma } from '@/lib/prisma'
import { athleteServerSchema } from '@/schemas/athleteSchema'
import { calculateAge } from '@/utils/athleteHelpers'
import { revalidatePath } from 'next/cache'

export async function createAthlete(data: unknown) {
  try {
    // Validar dados
    const validated = athleteServerSchema.parse(data)

    // Criar atleta
    const athlete = await prisma.athlete.create({
      data: {
        name: validated.name,
        gender: validated.gender || null,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
        weight: validated.weight,
        height: validated.height,
        photo: validated.photo || null,
        notes: validated.notes || null,
      },
    })

    // Associar esportes
    if (validated.sportIds && validated.sportIds.length > 0) {
      await prisma.athleteSport.createMany({
        data: validated.sportIds.map((sportId, index) => ({
          athleteId: athlete.id,
          sportId,
          isMain: index === 0, // Primeiro esporte é o principal
        })),
      })
    }

    // Revalidar cache
    revalidatePath('/dashboard/athletes')

    return {
      success: true,
      data: athlete,
    }
  } catch (error) {
    console.error('Erro ao criar atleta:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function updateAthlete(id: number, data: unknown) {
  try {
    // Validar dados
    const validated = athleteServerSchema.parse(data)

    // Atualizar atleta
    const athlete = await prisma.athlete.update({
      where: { id },
      data: {
        name: validated.name,
        gender: validated.gender || null,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
        weight: validated.weight,
        height: validated.height,
        photo: validated.photo || null,
        notes: validated.notes || null,
      },
    })

    // Atualizar esportes (remover e recriar)
    if (validated.sportIds) {
      await prisma.athleteSport.deleteMany({
        where: { athleteId: id },
      })

      if (validated.sportIds.length > 0) {
        await prisma.athleteSport.createMany({
          data: validated.sportIds.map((sportId, index) => ({
            athleteId: id,
            sportId,
            isMain: index === 0,
          })),
        })
      }
    }

    // Revalidar cache
    revalidatePath('/dashboard/athletes')
    revalidatePath(`/dashboard/athletes/${id}`)

    return {
      success: true,
      data: athlete,
    }
  } catch (error) {
    console.error('Erro ao atualizar atleta:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function deleteAthlete(id: number) {
  try {
    await prisma.athlete.delete({
      where: { id },
    })

    // Revalidar cache
    revalidatePath('/dashboard/athletes')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erro ao deletar atleta:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function getSports() {
  try {
    const sports = await prisma.sport.findMany({
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: sports,
    }
  } catch (error) {
    console.error('Erro ao buscar esportes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}

export async function getAthlete(id: number) {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        sports: {
          include: {
            sport: true,
          },
        },
      },
    })

    if (!athlete) {
      return {
        success: false,
        error: 'Atleta não encontrado',
        data: null,
      }
    }

    // Formatar dados para o formulário
    const formattedAthlete = {
      id: athlete.id,
      name: athlete.name,
      gender: athlete.gender as 'male' | 'female' | 'other' | null,
      birthDate: athlete.birthDate ? athlete.birthDate.toISOString().split('T')[0] : undefined,
      weight: athlete.weight ? Number(athlete.weight) : null,
      height: athlete.height ? Number(athlete.height) : null,
      photo: athlete.photo || undefined,
      sportIds: athlete.sports.map((as) => as.sportId),
      sports: athlete.sports.map((as) => ({
        id: as.sport.id,
        name: as.sport.name,
        isMain: as.isMain,
      })),
      age: calculateAge(athlete.birthDate),
      createdAt: athlete.createdAt.toISOString(),
      notes: athlete.notes || undefined,
    }

    return {
      success: true,
      data: formattedAthlete,
    }
  } catch (error) {
    console.error('Erro ao buscar atleta:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null,
    }
  }
}
