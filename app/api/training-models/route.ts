import { getTrainingModels } from '@/actions/trainingModels'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const models = await getTrainingModels()
    return NextResponse.json(models)
  } catch (error) {
    console.error('Erro ao buscar modelos de treino:', error)
    return NextResponse.json({ error: 'Erro ao buscar modelos de treino' }, { status: 500 })
  }
}
