'use client'

import { AthleteAnalyticsScreen } from '@/components/screens/analytics/AthleteAnalyticsScreen'
import { use } from 'react'

export default function AthleteAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <AthleteAnalyticsScreen athleteId={Number(id)} />
}
