'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { SettingsPage } from '@/components/screens/SettingsPage'

export default function SettingsRoute() {
  return (
    <MainLayout>
      <SettingsPage />
    </MainLayout>
  )
}
