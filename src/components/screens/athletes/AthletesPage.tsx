'use client'

import { deleteAthlete } from '@/actions/athletes'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useAthletes } from '@/hooks/useAthletes'
import { Add } from '@mui/icons-material'
import { Box, CircularProgress, Container, Fab, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { AthleteActionsDrawer } from './AthleteActionsDrawer'
import { AthleteFilters, AthleteFiltersButton } from './AthleteFiltersButton'
import { AthleteList } from './AthleteList'
import { AthleteSearch } from './AthleteSearch'
import { EmptyAthleteList } from './EmptyAthleteList'

export function AthletesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<AthleteFilters>({ gender: null })
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [debouncedSearch] = useDebounce(searchQuery, 300)

  const { athletes, loading, error } = useAthletes({
    search: debouncedSearch,
    gender: filters.gender ?? undefined,
  })

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const filteredAthletes = athletes
  const normalizedAthletes = filteredAthletes.map((athlete) => ({
    ...athlete,
    sports: athlete.sports.map((sport) => sport.name),
  }))

  const hasActiveFilters = Object.values(filters).some((v) => v !== null && v !== undefined)

  // Obter atleta selecionado
  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId)

  const handleAthleteClick = (athleteId: number) => {
    setSelectedAthleteId(athleteId)
    setDrawerOpen(true)
  }

  const handleViewAthlete = () => {
    if (selectedAthleteId) {
      router.push(`/dashboard/athletes/${selectedAthleteId}`)
    }
  }

  const handleEditAthlete = () => {
    if (selectedAthleteId) {
      router.push(`/dashboard/athletes/${selectedAthleteId}/edit`)
    }
  }

  const handleGoalsAthlete = () => {
    if (selectedAthleteId) {
      router.push(`/dashboard/athletes/${selectedAthleteId}/goals`)
    }
  }

  const handleDeleteAthlete = () => {
    if (selectedAthleteId) {
      setDeleteDialogOpen(true)
    }
  }

  const confirmDelete = async () => {
    if (!selectedAthleteId) return

    setIsDeleting(true)
    try {
      const result = await deleteAthlete(selectedAthleteId)

      if (result.success) {
        toast.success('Atleta deletado com sucesso!')
        setDeleteDialogOpen(false)
        // TODO: Recarregar lista de atletas
        router.refresh()
      } else {
        toast.error(result.error || 'Erro ao deletar atleta')
      }
    } catch (error) {
      console.error('Erro ao deletar atleta:', error)
      toast.error('Erro inesperado ao deletar atleta')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddAthlete = () => {
    router.push('/dashboard/athletes/new')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3, pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Atletas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie seus atletas e acompanhe seu progresso
        </Typography>
      </Box>

      {/* Busca e Filtros */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <AthleteSearch value={searchQuery} onChange={setSearchQuery} />
        <Box>
          <AthleteFiltersButton filters={filters} onFiltersChange={setFilters} />
        </Box>
      </Stack>

      {/* Lista de Atletas */}
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </Box>
      ) : filteredAthletes.length > 0 ? (
        <AthleteList athletes={normalizedAthletes} onAthleteClick={handleAthleteClick} />
      ) : (
        <EmptyAthleteList searchQuery={searchQuery} hasFilters={hasActiveFilters} />
      )}

      {/* Botão Flutuante para Adicionar */}
      <Fab
        color="primary"
        aria-label="adicionar atleta"
        onClick={handleAddAthlete}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
      >
        <Add />
      </Fab>

      {/* Drawer de Ações */}
      <AthleteActionsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        athleteName={selectedAthlete?.name || ''}
        athleteId={selectedAthleteId || 0}
        onView={handleViewAthlete}
        onEdit={handleEditAthlete}
        onGoals={handleGoalsAthlete}
        onDelete={handleDeleteAthlete}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Deletar Atleta"
        message={`Tem certeza que deseja deletar o atleta ${selectedAthlete?.name}? Esta ação não pode ser desfeita.`}
        confirmText={isDeleting ? 'Deletando...' : 'Deletar'}
        cancelText="Cancelar"
        confirmColor="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Container>
  )
}
