import { AthleteGoalsPage } from '@/components/screens/athletes/AthleteGoalsPage'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface AthleteGoalsRouteProps {
  params: Promise<{ id: string }>
}

export default async function AthleteGoalsRoute({ params }: AthleteGoalsRouteProps) {
  const { id } = await params
  const athleteId = Number(id)

  if (Number.isNaN(athleteId)) {
    notFound()
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { id: true, name: true },
  })

  if (!athlete) {
    notFound()
  }

  return <AthleteGoalsPage athleteId={athleteId} athleteName={athlete.name} />
}
