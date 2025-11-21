'use client'

import { ActiveTrainingScreen } from '@/components/screens/trainings/ActiveTrainingScreen'
import { use } from 'react'

export default function ActiveTrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ActiveTrainingScreen trainingId={Number(id)} />
}
