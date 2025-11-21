'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSports() {
  try {
    const sports = await prisma.sport.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            athletes: true,
            trainingModels: true,
          },
        },
      },
    })

    return { success: true, data: sports }
  } catch (error) {
    console.error('Error fetching sports:', error)
    return { success: false, error: 'Falha ao carregar esportes' }
  }
}

export async function createSport(name: string) {
  try {
    const sport = await prisma.sport.create({
      data: { name },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, data: sport }
  } catch (error) {
    console.error('Error creating sport:', error)
    return { success: false, error: 'Falha ao criar esporte' }
  }
}

export async function updateSport(id: number, name: string) {
  try {
    const sport = await prisma.sport.update({
      where: { id },
      data: { name },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, data: sport }
  } catch (error) {
    console.error('Error updating sport:', error)
    return { success: false, error: 'Falha ao atualizar esporte' }
  }
}

export async function deleteSport(id: number) {
  try {
    await prisma.sport.delete({
      where: { id },
    })

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error) {
    console.error('Error deleting sport:', error)
    return { success: false, error: 'Falha ao deletar esporte' }
  }
}
