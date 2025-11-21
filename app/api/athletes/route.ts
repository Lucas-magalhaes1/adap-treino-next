import { prisma } from '@/lib/prisma'
import { calculateAge } from '@/utils/athleteHelpers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender')

    // Buscar atletas com seus esportes
    const athletes = await prisma.athlete.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
        ...(gender && gender !== 'all' ? { gender: gender as any } : {}),
      },
      include: {
        sports: {
          include: {
            sport: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transformar dados para o formato esperado pelo frontend
    const athletesWithAge = athletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      gender: athlete.gender,
      birthDate: athlete.birthDate,
      weight: athlete.weight ? Number(athlete.weight) : null,
      height: athlete.height ? Number(athlete.height) : null,
      photo: athlete.photo,
      createdAt: athlete.createdAt,
      age: calculateAge(athlete.birthDate),
      notes: athlete.notes || undefined,
      sports: athlete.sports.map((as) => ({
        id: as.sport.id,
        name: as.sport.name,
        isMain: as.isMain,
      })),
    }))

    return NextResponse.json(athletesWithAge)
  } catch (error) {
    console.error('Erro ao buscar atletas:', error)
    return NextResponse.json({ error: 'Erro ao buscar atletas' }, { status: 500 })
  }
}
