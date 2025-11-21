'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { TrainingsListScreen } from '@/components/screens/trainings/TrainingsListScreen'

export default function TrainingsRoute() {
  return (
    <MainLayout>
      <TrainingsListScreen />
    </MainLayout>
  )
}
