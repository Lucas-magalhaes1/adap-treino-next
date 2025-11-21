import { createGoal, getAthleteGoalsDashboard } from '@/actions/goals'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

function parseAthleteId(rawId: string) {
  const athleteId = Number(rawId)
  if (Number.isNaN(athleteId)) {
    throw new Error('Atleta inválido')
  }
  return athleteId
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const athleteId = parseAthleteId(id)
    const result = await getAthleteGoalsDashboard(athleteId)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error ?? 'Metas não encontradas' }, { status: 404 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const athleteId = parseAthleteId(id)
    const payload = await request.json()
    const result = await createGoal(athleteId, payload)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Não foi possível criar a meta' },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
