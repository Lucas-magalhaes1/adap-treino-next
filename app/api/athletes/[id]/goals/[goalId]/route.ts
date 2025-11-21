import { deleteGoal, getGoalDetails, updateGoal } from 'app/actions/goals'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
    goalId: string
  }>
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { goalId } = await params
    const parsedGoalId = Number(goalId)

    if (Number.isNaN(parsedGoalId)) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const result = await getGoalDetails(parsedGoalId)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error ?? 'Meta não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { goalId } = await params
    const parsedGoalId = Number(goalId)

    if (Number.isNaN(parsedGoalId)) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const body = await request.json()
    const result = await updateGoal(parsedGoalId, body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Erro ao editar meta:', error)
    return NextResponse.json({ error: 'Erro ao editar meta' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const { goalId } = await params
    const parsedGoalId = Number(goalId)

    if (Number.isNaN(parsedGoalId)) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const result = await deleteGoal(parsedGoalId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar meta:', error)
    return NextResponse.json({ error: 'Erro ao deletar meta' }, { status: 500 })
  }
}
