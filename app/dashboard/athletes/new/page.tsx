'use client'

import { createAthlete, getSports } from '@/actions/athletes'
import { AthleteForm } from '@/components/screens/athletes/AthleteForm'
import type { AthleteFormData } from '@/schemas/athleteSchema'
import { Box, CircularProgress } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function NewAthletePage() {
  const router = useRouter()
  const [sports, setSports] = useState<Array<{ id: number; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSports() {
      const result = await getSports()
      if (result.success && result.data) {
        setSports(result.data)
      } else {
        toast.error('Erro ao carregar esportes')
      }
      setIsLoading(false)
    }
    loadSports()
  }, [])

  const handleSave = async (data: AthleteFormData) => {
    try {
      const result = await createAthlete(data)

      if (result.success) {
        toast.success('Atleta criado com sucesso!')
        router.push('/dashboard/athletes')
      } else {
        toast.error(result.error || 'Erro ao criar atleta')
      }
    } catch (error) {
      console.error('Erro ao criar atleta:', error)
      toast.error('Erro inesperado ao criar atleta')
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

  return <AthleteForm availableSports={sports} onSave={handleSave} onCancel={handleCancel} />
}
