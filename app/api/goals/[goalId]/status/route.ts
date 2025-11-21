import { updateGoalStatus } from '@/actions/goals'
import { NextResponse } from 'next/server'

type GoalStatus = 'active' | 'completed' | 'expired'

interface RouteParams {
  params: Promise<{ goalId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { goalId } = await params
    const parsedGoalId = Number(goalId)

    if (Number.isNaN(parsedGoalId)) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const { status } = (await request.json()) as { status: GoalStatus }

    const result = await updateGoalStatus(parsedGoalId, status)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Não foi possível atualizar' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
