import { getAthleteGroups } from '@/actions/athleteGroups'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await getAthleteGroups()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result)
}
