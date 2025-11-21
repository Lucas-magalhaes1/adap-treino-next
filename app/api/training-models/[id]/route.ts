import { deleteTrainingModel } from '@/actions/trainingModels'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const { id: modelId } = await params
    const id = Number(modelId)

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await deleteTrainingModel(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar modelo de treino:', error)
    return NextResponse.json({ error: 'Erro ao deletar modelo de treino' }, { status: 500 })
  }
}
