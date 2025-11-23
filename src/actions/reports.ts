'use server'

import { prisma } from '@/lib/prisma'

export async function getGoalsReport(filters?: {
  athleteId?: number
  status?: 'active' | 'completed' | 'expired'
  startDate?: string
  endDate?: string
}) {
  try {
    const where: any = {}

    if (filters?.athleteId) {
      where.athleteId = filters.athleteId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate)
      }
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        goalHistory: {
          orderBy: { dateRecorded: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calcular estatísticas
    const total = goals.length
    const active = goals.filter((g) => g.status === 'active').length
    const completed = goals.filter((g) => g.status === 'completed').length
    const expired = goals.filter((g) => g.status === 'expired').length

    // Calcular metas próximas do prazo (próximos 7 dias)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nearDeadline = goals.filter(
      (g) =>
        g.status === 'active' &&
        g.targetDate &&
        new Date(g.targetDate) <= sevenDaysFromNow &&
        new Date(g.targetDate) >= now
    )

    // Formatar metas para o relatório
    const formattedGoals = goals.map((goal) => {
      const lastEntry = goal.goalHistory[0]
      const startValue = goal.startValue ? Number(goal.startValue) : 0
      const currentValue = lastEntry ? Number(lastEntry.currentValue) : startValue
      const targetValue = Number(goal.targetValue)
      const delta = targetValue - startValue
      const progress = delta === 0 ? 0 : Math.min(((currentValue - startValue) / delta) * 100, 100)

      // Verificar se está atrasada
      const isOverdue =
        goal.status === 'active' && goal.targetDate && new Date(goal.targetDate) < now

      return {
        id: goal.id,
        title: goal.title,
        athlete: {
          id: goal.athlete.id,
          name: goal.athlete.name,
          photo: goal.athlete.photo || undefined,
        },
        status: goal.status,
        startValue,
        currentValue,
        targetValue,
        unit: goal.unit,
        progress: Math.max(0, Math.round(progress)),
        targetDate: goal.targetDate?.toISOString() || null,
        startDate: goal.startDate.toISOString(),
        isOverdue: isOverdue || false,
        isNearDeadline: nearDeadline.some((g) => g.id === goal.id),
      }
    })

    return {
      goals: formattedGoals,
      statistics: {
        total,
        active,
        completed,
        expired,
        nearDeadline: nearDeadline.length,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar relatório de metas:', error)
    throw error
  }
}

export async function getTrainingFrequencyReport(filters?: {
  sportId?: number
  groupId?: number
  startDate?: string
  endDate?: string
}) {
  try {
    const where: any = {}

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate)
      }
    }

    // Buscar treinos com participantes
    const trainings = await prisma.training.findMany({
      where,
      include: {
        participants: {
          include: {
            athlete: {
              select: {
                id: true,
                name: true,
                photo: true,
                sports: {
                  include: {
                    sport: true,
                  },
                },
              },
            },
          },
        },
        model: {
          select: {
            id: true,
            name: true,
            sportId: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Agregar dados por atleta
    const athleteMap = new Map<
      number,
      {
        id: number
        name: string
        photo: string | null
        trainingCount: number
        sports: Set<number>
        trainings: Date[]
      }
    >()

    trainings.forEach((training) => {
      training.participants.forEach((participant) => {
        const athleteId = participant.athlete.id

        // Filtrar por esporte se especificado
        if (filters?.sportId) {
          const hasSport = participant.athlete.sports.some((s) => s.sportId === filters.sportId)
          if (!hasSport && training.model?.sportId !== filters.sportId) {
            return
          }
        }

        if (!athleteMap.has(athleteId)) {
          athleteMap.set(athleteId, {
            id: participant.athlete.id,
            name: participant.athlete.name,
            photo: participant.athlete.photo,
            trainingCount: 0,
            sports: new Set(),
            trainings: [],
          })
        }

        const data = athleteMap.get(athleteId)!
        data.trainingCount++
        data.trainings.push(training.date)

        // Adicionar esportes
        participant.athlete.sports.forEach((s) => data.sports.add(s.sportId))
        if (training.model?.sportId) {
          data.sports.add(training.model.sportId)
        }
      })
    })

    // Filtrar por grupo se especificado
    if (filters?.groupId) {
      const groupMembers = await prisma.athleteGroup.findUnique({
        where: { id: filters.groupId },
        include: {
          members: {
            select: { athleteId: true },
          },
        },
      })

      if (groupMembers) {
        const memberIds = new Set(groupMembers.members.map((a) => a.athleteId))
        // Manter apenas atletas do grupo
        for (const [athleteId] of athleteMap) {
          if (!memberIds.has(athleteId)) {
            athleteMap.delete(athleteId)
          }
        }
      }
    }

    // Calcular período em dias
    const startDate = filters?.startDate ? new Date(filters.startDate) : null
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date()
    const firstTraining = trainings.length > 0 ? trainings[trainings.length - 1].date : null
    const effectiveStartDate = startDate || firstTraining || new Date()
    const periodDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    const periodWeeks = Math.max(1, periodDays / 7)
    const periodMonths = Math.max(1, periodDays / 30)

    // Converter para array e calcular médias
    const athleteData = Array.from(athleteMap.values()).map((athlete) => {
      const avgPerWeek = athlete.trainingCount / periodWeeks
      const avgPerMonth = athlete.trainingCount / periodMonths

      // Definir baixa frequência: menos de 1 treino por semana
      const lowFrequency = avgPerWeek < 1

      return {
        id: athlete.id,
        name: athlete.name,
        photo: athlete.photo || undefined,
        trainingCount: athlete.trainingCount,
        avgPerWeek: Number(avgPerWeek.toFixed(1)),
        avgPerMonth: Number(avgPerMonth.toFixed(1)),
        lowFrequency,
        sportsCount: athlete.sports.size,
      }
    })

    // Ordenar por quantidade de treinos (maior para menor)
    athleteData.sort((a, b) => b.trainingCount - a.trainingCount)

    // Calcular estatísticas gerais
    const totalAthletes = athleteData.length
    const totalTrainings = trainings.length
    const averageTrainingsPerAthlete = totalAthletes > 0 ? totalTrainings / totalAthletes : 0
    const lowFrequencyCount = athleteData.filter((a) => a.lowFrequency).length
    const activeAthletes = athleteData.filter((a) => a.trainingCount > 0).length

    return {
      athletes: athleteData,
      statistics: {
        totalAthletes,
        totalTrainings,
        activeAthletes,
        averageTrainingsPerAthlete: Number(averageTrainingsPerAthlete.toFixed(1)),
        lowFrequencyCount,
        periodDays,
        periodWeeks: Number(periodWeeks.toFixed(1)),
        periodMonths: Number(periodMonths.toFixed(1)),
      },
      period: {
        startDate: effectiveStartDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }
  } catch (error) {
    console.error('Erro ao buscar relatório de frequência:', error)
    throw error
  }
}
