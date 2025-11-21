'use server'

import { prisma } from '@/lib/prisma'
import { goalProgressSchema, goalServerSchema } from '@/schemas/goalSchema'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

type GoalStatus = 'active' | 'completed' | 'expired'

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  return Number(value)
}

const GOALS_PATH = (athleteId: number) => `/dashboard/athletes/${athleteId}/goals`

export async function getAthleteGoals(athleteId: number) {
  try {
    const goals = await prisma.goal.findMany({
      where: { athleteId },
      include: {
        performanceMetric: {
          select: {
            id: true,
            name: true,
          },
        },
        goalHistory: {
          orderBy: { dateRecorded: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return goals.map((goal) => {
      const lastEntry = goal.goalHistory[0]
      const currentValue = lastEntry ? toNumber(lastEntry.currentValue) : toNumber(goal.startValue)

      return {
        id: goal.id,
        title: goal.title,
        status: goal.status as GoalStatus,
        performanceMetric: goal.performanceMetric?.name,
        startValue: toNumber(goal.startValue),
        targetValue: toNumber(goal.targetValue),
        currentValue,
        unit: goal.unit,
        targetDate: goal.targetDate?.toISOString() ?? null,
        startDate: goal.startDate.toISOString(),
      }
    })
  } catch (error) {
    console.error('Erro ao buscar metas do atleta', error)
    return []
  }
}

export async function getAthleteGoalsDashboard(athleteId: number) {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        id: true,
        name: true,
      },
    })

    if (!athlete) {
      return { success: false, error: 'Atleta não encontrado', data: null }
    }

    const [goals, records] = await Promise.all([
      prisma.goal.findMany({
        where: { athleteId },
        include: {
          goalHistory: {
            orderBy: { dateRecorded: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.personalRecord.findMany({
        where: { athleteId },
        include: { performanceMetric: true },
        orderBy: { dateAchieved: 'desc' },
      }),
    ])

    const activeGoals = goals
      .filter((goal) => goal.status === 'active')
      .map((goal) => {
        const sortedHistory = goal.goalHistory.sort(
          (a, b) => a.dateRecorded.getTime() - b.dateRecorded.getTime()
        )
        const lastEntry = sortedHistory.at(-1)
        const startValue = toNumber(goal.startValue)
        const currentValue = lastEntry ? toNumber(lastEntry.currentValue) : startValue
        const targetValue = toNumber(goal.targetValue) ?? 0
        const delta = targetValue - (startValue ?? 0)
        const progress =
          delta === 0 ? 0 : Math.min(((currentValue ?? 0) - (startValue ?? 0)) / delta, 1)

        return {
          id: goal.id,
          title: goal.title,
          unit: goal.unit,
          startValue,
          currentValue,
          targetValue,
          targetDate: goal.targetDate?.toISOString() ?? null,
          status: goal.status as GoalStatus,
          progressPercentage: Math.max(0, Number((progress * 100).toFixed(1))),
          lastUpdate: lastEntry?.dateRecorded.toISOString() ?? goal.createdAt.toISOString(),
        }
      })

    const historyTimeline = goals
      .filter((goal) => goal.status !== 'active')
      .map((goal) => ({
        id: goal.id,
        title: goal.title,
        status: goal.status as GoalStatus,
        date:
          goal.status === 'completed'
            ? goal.updatedAt.toISOString()
            : (goal.targetDate?.toISOString() ?? goal.updatedAt.toISOString()),
      }))

    const personalRecords = records.map((record) => ({
      id: record.id,
      title: record.performanceMetric?.name ?? 'Recorde Pessoal',
      value: Number(record.value),
      unit: record.unit,
      dateAchieved: record.dateAchieved.toISOString(),
      notes: record.notes ?? undefined,
    }))

    return {
      success: true,
      data: {
        athlete,
        activeGoals,
        history: historyTimeline,
        personalRecords,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar metas do atleta', error)
    return { success: false, error: 'Erro ao buscar metas', data: null }
  }
}

export async function getGoalDetails(goalId: number) {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        goalHistory: {
          orderBy: { dateRecorded: 'asc' },
        },
        athlete: {
          select: { id: true, name: true },
        },
      },
    })

    if (!goal) {
      return { success: false, error: 'Meta não encontrada', data: null }
    }

    const history = goal.goalHistory.map((entry) => ({
      id: entry.id,
      value: Number(entry.currentValue),
      notes: entry.notes ?? undefined,
      date: entry.dateRecorded.toISOString(),
    }))

    return {
      success: true,
      data: {
        id: goal.id,
        athleteId: goal.athleteId,
        athleteName: goal.athlete.name,
        title: goal.title,
        unit: goal.unit,
        status: goal.status as GoalStatus,
        strategyNotes: goal.strategyNotes ?? undefined,
        startValue: toNumber(goal.startValue),
        targetValue: Number(goal.targetValue),
        targetDate: goal.targetDate?.toISOString() ?? null,
        startDate: goal.startDate.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        history,
        currentValue: history.at(-1)?.value ?? toNumber(goal.startValue),
      },
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes da meta', error)
    return { success: false, error: 'Erro ao buscar meta', data: null }
  }
}

export async function createGoal(athleteId: number, payload: any) {
  try {
    const parsed = goalServerSchema.parse({ ...payload, athleteId })

    const goal = await prisma.goal.create({
      data: {
        athleteId,
        title: parsed.title,
        startValue: new Prisma.Decimal(parsed.startValue),
        targetValue: new Prisma.Decimal(parsed.targetValue),
        unit: parsed.unit,
        startDate: new Date(),
        targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
        strategyNotes: parsed.notes?.trim() ? parsed.notes.trim() : null,
        status: 'active',
      },
    })

    await prisma.goalHistory.create({
      data: {
        goalId: goal.id,
        currentValue: new Prisma.Decimal(parsed.startValue),
        notes: parsed.notes?.trim() || 'Marca inicial registrada',
      },
    })

    revalidatePath(GOALS_PATH(athleteId))

    return { success: true, data: goal }
  } catch (error) {
    console.error('Erro ao criar meta', error)
    return { success: false, error: 'Não foi possível criar a meta' }
  }
}

export async function appendGoalProgress(goalId: number, payload: unknown) {
  try {
    const parsed = goalProgressSchema.parse(payload)

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { athleteId: true },
    })

    if (!goal) {
      return { success: false, error: 'Meta não encontrada' }
    }

    const historyEntry = await prisma.goalHistory.create({
      data: {
        goalId,
        currentValue: new Prisma.Decimal(parsed.currentValue),
        notes: parsed.notes?.trim() || null,
      },
    })

    revalidatePath(GOALS_PATH(goal.athleteId))

    return { success: true, data: { id: historyEntry.id } }
  } catch (error) {
    console.error('Erro ao registrar progresso', error)
    return { success: false, error: 'Não foi possível registrar o progresso' }
  }
}

export async function updateGoalStatus(goalId: number, status: GoalStatus) {
  try {
    if (!['active', 'completed', 'expired'].includes(status)) {
      return { success: false, error: 'Status inválido' }
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        goalHistory: {
          orderBy: { dateRecorded: 'desc' },
          take: 1,
        },
      },
    })

    if (!goal) {
      return { success: false, error: 'Meta não encontrada' }
    }

    // Se estiver concluindo, criar entrada final no histórico
    if (status === 'completed') {
      const lastEntry = goal.goalHistory[0]
      const currentValue = lastEntry
        ? lastEntry.currentValue
        : (goal.startValue ?? goal.targetValue)

      // Só cria nova entrada se a última não for de hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lastEntryDate = lastEntry ? new Date(lastEntry.dateRecorded) : null
      lastEntryDate?.setHours(0, 0, 0, 0)

      const shouldCreateEntry = !lastEntryDate || lastEntryDate.getTime() !== today.getTime()

      if (shouldCreateEntry) {
        await prisma.goalHistory.create({
          data: {
            goalId,
            currentValue: new Prisma.Decimal(goal.targetValue), // Salva o valor da meta alcançada
            notes: 'Meta concluída',
          },
        })
      }
    }

    await prisma.goal.update({
      where: { id: goalId },
      data: { status },
    })

    revalidatePath(GOALS_PATH(goal.athleteId))

    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar status da meta', error)
    return { success: false, error: 'Não foi possível atualizar a meta' }
  }
}

export async function deleteGoal(goalId: number) {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { athleteId: true },
    })

    if (!goal) {
      return { success: false, error: 'Meta não encontrada' }
    }

    await prisma.goal.delete({
      where: { id: goalId },
    })

    revalidatePath(GOALS_PATH(goal.athleteId))

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar meta', error)
    return { success: false, error: 'Não foi possível deletar a meta' }
  }
}

export async function updateGoal(goalId: number, payload: any) {
  try {
    const parsed = goalServerSchema.partial().parse(payload)

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { athleteId: true },
    })

    if (!goal) {
      return { success: false, error: 'Meta não encontrada' }
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(parsed.title && { title: parsed.title }),
        ...(parsed.startValue !== undefined && {
          startValue: new Prisma.Decimal(parsed.startValue),
        }),
        ...(parsed.targetValue !== undefined && {
          targetValue: new Prisma.Decimal(parsed.targetValue),
        }),
        ...(parsed.unit && { unit: parsed.unit }),
        ...(parsed.targetDate && { targetDate: new Date(parsed.targetDate) }),
        ...(parsed.notes !== undefined && {
          strategyNotes: parsed.notes?.trim() ? parsed.notes.trim() : null,
        }),
      },
    })

    revalidatePath(GOALS_PATH(goal.athleteId))

    return { success: true, data: updated }
  } catch (error) {
    console.error('Erro ao editar meta', error)
    return { success: false, error: 'Não foi possível editar a meta' }
  }
}
