'use client'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Add, Delete, Edit, FitnessCenter } from '@mui/icons-material'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { EmptyState } from '../../common/EmptyState'
import { FloatingActionButton } from '../../common/FloatingActionButton'
import { SportDialog } from './SportDialog'

interface Sport {
  id: number
  name: string
  _count: {
    athletes: number
    trainingModels: number
  }
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Erro ao carregar dados')
  return response.json()
}

export function ManageSportsScreen() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Sport[] }>(
    '/api/sports',
    fetcher
  )

  const handleCreate = useCallback(
    async (name: string) => {
      const { createSport } = await import('@/actions/sports')
      const result = await createSport(name)

      if (!result.success) {
        toast.error(result.error ?? 'Não foi possível criar o esporte')
        throw new Error(result.error)
      }

      toast.success('Esporte criado com sucesso!')
      await mutate()
    },
    [mutate]
  )

  const handleEdit = useCallback(
    async (name: string) => {
      if (!selectedSport) return

      const { updateSport } = await import('@/actions/sports')
      const result = await updateSport(selectedSport.id, name)

      if (!result.success) {
        toast.error(result.error ?? 'Não foi possível atualizar o esporte')
        throw new Error(result.error)
      }

      toast.success('Esporte atualizado com sucesso!')
      await mutate()
    },
    [mutate, selectedSport]
  )

  const handleDelete = useCallback(async () => {
    if (!selectedSport) return

    const { deleteSport } = await import('@/actions/sports')
    const result = await deleteSport(selectedSport.id)

    if (!result.success) {
      toast.error(result.error ?? 'Não foi possível deletar o esporte')
      return
    }

    toast.success('Esporte deletado com sucesso!')
    await mutate()
    setDeleteConfirmOpen(false)
    setSelectedSport(null)
  }, [mutate, selectedSport])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">Não foi possível carregar os esportes.</Alert>
  }

  const sports = data?.data ?? []

  if (sports.length === 0) {
    return (
      <>
        <EmptyState
          icon={<FitnessCenter fontSize="large" color="action" />}
          title="Nenhum esporte cadastrado"
          description="Crie esportes para categorizar atletas e treinos."
          action={{
            label: 'Adicionar esporte',
            onClick: () => {
              setSelectedSport(null)
              setDialogOpen(true)
            },
          }}
        />
        <SportDialog
          open={dialogOpen}
          sport={selectedSport}
          onClose={() => setDialogOpen(false)}
          onSubmit={selectedSport ? handleEdit : handleCreate}
        />
      </>
    )
  }

  return (
    <>
      <Stack spacing={2}>
        {sports.map((sport) => (
          <Card key={sport.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack flex={1} spacing={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {sport.name}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`${sport._count.athletes} atletas`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${sport._count.trainingModels} modelos`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedSport(sport)
                      setDialogOpen(true)
                    }}
                    sx={{ color: 'primary.main' }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedSport(sport)
                      setDeleteConfirmOpen(true)
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <FloatingActionButton
        label="Novo esporte"
        color="primary"
        icon={<Add />}
        onClick={() => {
          setSelectedSport(null)
          setDialogOpen(true)
        }}
      />

      <SportDialog
        open={dialogOpen}
        sport={selectedSport}
        onClose={() => setDialogOpen(false)}
        onSubmit={selectedSport ? handleEdit : handleCreate}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Deletar Esporte"
        message={`Tem certeza que deseja deletar "${selectedSport?.name}"? Todos os dados relacionados (atletas, treinos) também serão removidos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmText="Deletar"
        confirmColor="error"
      />
    </>
  )
}
