'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { AthletesPage } from '@/components/screens/athletes/AthletesPage'

export default function AthletesRoute() {
  return (
    <MainLayout>
      <AthletesPage />
    </MainLayout>
  )
}
