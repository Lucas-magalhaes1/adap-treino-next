'use client'

import { useEffect, useState } from 'react'

interface AthleteSport {
  id: number
  name: string
  isMain: boolean
}

interface Athlete {
  id: number
  name: string
  gender?: string | null
  birthDate?: string | null
  weight?: number | null
  height?: number | null
  photo?: string | null
  age?: number
  notes?: string
  sports: AthleteSport[]
}

interface UseAthletesOptions {
  search?: string
  gender?: string | null
}

export function useAthletes(options: UseAthletesOptions = {}) {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (options.search) params.append('search', options.search)
        if (options.gender) params.append('gender', options.gender)

        const response = await fetch(`/api/athletes?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Erro ao buscar atletas')
        }

        const data = await response.json()
        setAthletes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setAthletes([])
      } finally {
        setLoading(false)
      }
    }

    fetchAthletes()
  }, [options.search, options.gender])

  return { athletes, loading, error }
}
