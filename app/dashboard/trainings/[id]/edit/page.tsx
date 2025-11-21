'use client'

import { ActiveTrainingScreen } from '@/components/screens/trainings/ActiveTrainingScreen'
import { use } from 'react'

export default function EditTrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // Reutilizar o ActiveTrainingScreen para edição
  // O componente já suporta edição, só muda o título e permite salvar novamente
  return <ActiveTrainingScreen trainingId={Number(id)} />
}
