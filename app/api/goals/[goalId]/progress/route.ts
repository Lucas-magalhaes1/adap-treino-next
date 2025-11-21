import { appendGoalProgress } from '@/actions/goals'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ goalId: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { goalId } = await params
    const parsedGoalId = Number(goalId)

    if (Number.isNaN(parsedGoalId)) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const payload = await request.json()
    const result = await appendGoalProgress(parsedGoalId, payload)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Não foi possível registrar' },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data ?? { success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
