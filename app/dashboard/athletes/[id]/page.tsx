import { getAthlete } from '@/actions/athletes'
import { MainLayout } from '@/components/layout/MainLayout'
import { AthleteDetailsPage } from '@/components/screens/athletes/AthleteDetailsPage'
import { notFound } from 'next/navigation'

interface AthleteDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function AthleteDetailRoute({ params }: AthleteDetailRouteProps) {
  const { id } = await params
  const athleteId = Number(id)

  if (Number.isNaN(athleteId)) {
    notFound()
  }

  const result = await getAthlete(athleteId)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <MainLayout>
      <AthleteDetailsPage athlete={result.data} />
    </MainLayout>
  )
}
