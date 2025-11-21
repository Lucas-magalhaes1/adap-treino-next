import { getSports } from '@/actions/sports'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await getSports()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json(result)
}
