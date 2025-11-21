'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getAthleteGroups() {
  try {
    const groups = await prisma.athleteGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
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

    return { success: true, data: groups }
  } catch (error) {
    console.error('Error fetching athlete groups:', error)
    return { success: false, error: 'Falha ao carregar grupos' }
  }
}

export async function createAthleteGroup(data: {
  name: string
  description?: string
  athleteIds: number[]
}) {
  try {
    const group = await prisma.athleteGroup.create({
      data: {
        name: data.name,
        description: data.description,
        members: {
          create: data.athleteIds.map((athleteId) => ({
            athleteId,
          })),
        },
      },
      include: {
        members: {
          include: {
            athlete: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, data: group }
  } catch (error) {
    console.error('Error creating athlete group:', error)
    return { success: false, error: 'Falha ao criar grupo' }
  }
}

export async function updateAthleteGroup(
  id: number,
  data: { name: string; description?: string; athleteIds: number[] }
) {
  try {
    // Deletar membros existentes e recriar
    await prisma.athleteGroupMember.deleteMany({
      where: { groupId: id },
    })

    const group = await prisma.athleteGroup.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        members: {
          create: data.athleteIds.map((athleteId) => ({
            athleteId,
          })),
        },
      },
      include: {
        members: {
          include: {
            athlete: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, data: group }
  } catch (error) {
    console.error('Error updating athlete group:', error)
    return { success: false, error: 'Falha ao atualizar grupo' }
  }
}

export async function deleteAthleteGroup(id: number) {
  try {
    await prisma.athleteGroup.delete({
      where: { id },
    })

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error deleting athlete group:', error)
    return { success: false, error: 'Falha ao deletar grupo' }
  }
}

export async function getAllAthletes() {
  try {
    const athletes = await prisma.athlete.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        photo: true,
      },
    })

    return { success: true, data: athletes }
  } catch (error) {
    console.error('Error fetching athletes:', error)
    return { success: false, error: 'Falha ao carregar atletas' }
  }
}
