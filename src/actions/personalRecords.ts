'use server'

import { prisma } from '@/lib/prisma'
import { PersonalRecordFormSchema } from '@/schemas/personalRecordSchema'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getPersonalRecords(athleteId: number) {
  const records = await prisma.personalRecord.findMany({
    where: {
      athleteId,
    },
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
          photo: true,
        },
      },
    },
    orderBy: {
      dateAchieved: 'desc',
    },
  })

  return records.map((record) => ({
    ...record,
    value: record.value.toString(),
  }))
}

export async function createPersonalRecord(
  athleteId: number,
  data: PersonalRecordFormSchema
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.personalRecord.create({
      data: {
        athleteId,
        title: data.title,
        value: new Prisma.Decimal(data.value),
        unit: data.unit,
        dateAchieved: new Date(data.dateAchieved),
        notes: data.notes,
      },
    })

    revalidatePath(`/dashboard/athletes/${athleteId}/goals`)
    return { success: true }
  } catch (error) {
    console.error('Error creating personal record:', error)
    return { success: false, error: 'Falha ao criar recorde pessoal' }
  }
}

export async function updatePersonalRecord(
  recordId: number,
  athleteId: number,
  data: PersonalRecordFormSchema
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.personalRecord.update({
      where: { id: recordId },
      data: {
        title: data.title,
        value: new Prisma.Decimal(data.value),
        unit: data.unit,
        dateAchieved: new Date(data.dateAchieved),
        notes: data.notes,
      },
    })

    revalidatePath(`/dashboard/athletes/${athleteId}/goals`)
    return { success: true }
  } catch (error) {
    console.error('Error updating personal record:', error)
    return { success: false, error: 'Falha ao atualizar recorde pessoal' }
  }
}

export async function deletePersonalRecord(
  recordId: number,
  athleteId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.personalRecord.delete({
      where: { id: recordId },
    })

    revalidatePath(`/dashboard/athletes/${athleteId}/goals`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting personal record:', error)
    return { success: false, error: 'Falha ao deletar recorde pessoal' }
  }
}
