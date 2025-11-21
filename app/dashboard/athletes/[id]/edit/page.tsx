'use client'

import { getAthlete, getSports, updateAthlete } from '@/actions/athletes'
import { AthleteForm } from '@/components/screens/athletes/AthleteForm'
import type { AthleteFormData } from '@/schemas/athleteSchema'
import { Box, CircularProgress } from '@mui/material'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function EditAthletePage() {
  const router = useRouter()
  const params = useParams()
  const athleteId = Number(params.id)

  const [sports, setSports] = useState<Array<{ id: number; name: string }>>([])
  const [initialData, setInitialData] = useState<Partial<AthleteFormData> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Buscar esportes e atleta em paralelo
        const [sportsResult, athleteResult] = await Promise.all([
          getSports(),
          getAthlete(athleteId),
        ])

        if (sportsResult.success && sportsResult.data) {
          setSports(sportsResult.data)
        } else {
          toast.error('Erro ao carregar esportes')
        }

        if (athleteResult.success && athleteResult.data) {
          const { name, gender, birthDate, weight, height, photo, sportIds, notes } =
            athleteResult.data
          setInitialData({
            name,
            gender,
            birthDate,
            weight,
            height,
            photo,
            sportIds,
            notes,
          })
        } else {
          toast.error('Erro ao carregar atleta')
          router.push('/dashboard/athletes')
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados')
        router.push('/dashboard/athletes')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [athleteId, router])

  const handleSave = async (data: AthleteFormData) => {
    try {
      const result = await updateAthlete(athleteId, data)

      if (result.success) {
        toast.success('Atleta atualizado com sucesso!')
        router.push('/dashboard/athletes')
      } else {
        toast.error(result.error || 'Erro ao atualizar atleta')
      }
    } catch (error) {
      console.error('Erro ao atualizar atleta:', error)
      toast.error('Erro inesperado ao atualizar atleta')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <AthleteForm
      athleteId={athleteId}
      initialData={initialData || undefined}
      availableSports={sports}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
