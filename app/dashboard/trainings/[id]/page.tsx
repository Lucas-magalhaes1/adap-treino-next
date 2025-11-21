'use client'

import { TrainingDetailsScreen } from '@/components/screens/trainings/TrainingDetailsScreen'
import { use } from 'react'

export default function TrainingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <TrainingDetailsScreen trainingId={Number(id)} />
}
