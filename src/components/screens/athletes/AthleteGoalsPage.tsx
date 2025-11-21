'use client'

import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import { GoalFormSchema } from '@/schemas/goalSchema'
import { PersonalRecordFormSchema } from '@/schemas/personalRecordSchema'
import { GoalDetail, GoalsDashboardResponse, PersonalRecordSummary } from '@/types/goal'
import { ArrowBack } from '@mui/icons-material'
import { Alert, Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ConfirmDialog } from '../../common/ConfirmDialog'
import { ActiveGoalsScreen } from '../goals/ActiveGoalsScreen'
import { EditGoalDialog } from '../goals/EditGoalDialog'
import { GoalDetailsScreen } from '../goals/GoalDetailsScreen'
import { GoalsBottomNavigation, GoalsTab } from '../goals/GoalsBottomNavigation'
import { HistoryTimelineScreen } from '../goals/HistoryTimelineScreen'
import { NewGoalDialog } from '../goals/NewGoalDialog'
import { PersonalRecordsScreen } from '../goals/PersonalRecordsScreen'
import { UpdateProgressDialog } from '../goals/UpdateProgressDialog'
import { EditPersonalRecordDialog } from '../personalRecords/EditPersonalRecordDialog'
import { NewPersonalRecordDialog } from '../personalRecords/NewPersonalRecordDialog'

interface AthleteGoalsPageProps {
  athleteId: number
  athleteName: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao carregar dados')
  }
  return response.json()
}

export function AthleteGoalsPage({ athleteId, athleteName }: AthleteGoalsPageProps) {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<GoalsTab>('active')
  const [newGoalOpen, setNewGoalOpen] = useState(false)
  const [editGoalOpen, setEditGoalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)

  // Personal Records states
  const [newRecordOpen, setNewRecordOpen] = useState(false)
  const [editRecordOpen, setEditRecordOpen] = useState(false)
  const [deleteRecordConfirmOpen, setDeleteRecordConfirmOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PersonalRecordSummary | null>(null)

  const goalsEndpoint = `/api/athletes/${athleteId}/goals`

  const { data, error, isLoading, mutate } = useSWR<GoalsDashboardResponse>(goalsEndpoint, fetcher)

  const {
    data: goalDetails,
    isLoading: goalLoading,
    mutate: mutateGoalDetails,
  } = useSWR<GoalDetail>(
    selectedGoalId ? `/api/athletes/${athleteId}/goals/${selectedGoalId}` : null,
    fetcher
  )

  const headerTitle = useMemo(() => {
    if (currentTab === 'records') return 'Recordes Pessoais'
    if (currentTab === 'history') return 'Histórico'
    return `Metas de ${athleteName}`
  }, [athleteName, currentTab])

  const handleCreateGoal = useCallback(
    async (values: GoalFormSchema) => {
      const response = await fetch(goalsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error ?? 'Não foi possível criar a meta'
        toast.error(message)
        throw new Error(message)
      }

      toast.success('Meta criada com sucesso!')
      await mutate()
    },
    [goalsEndpoint, mutate]
  )

  const handleSelectGoal = (goalId: number) => {
    setSelectedGoalId(goalId)
    setDetailsOpen(true)
  }

  const handleProgressSubmit = useCallback(
    async (values: { currentValue: number; notes?: string }) => {
      if (!selectedGoalId) {
        const message = 'Selecione uma meta para atualizar o progresso'
        toast.error(message)
        throw new Error(message)
      }

      const response = await fetch(`/api/goals/${selectedGoalId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error ?? 'Não foi possível registrar o progresso'
        toast.error(message)
        throw new Error(message)
      }

      toast.success('Progresso atualizado!')
      await mutate()
      await mutateGoalDetails()
    },
    [mutate, mutateGoalDetails, selectedGoalId]
  )

  const handleCompleteGoal = useCallback(async () => {
    if (!selectedGoalId) return

    const response = await fetch(`/api/goals/${selectedGoalId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      toast.error(payload?.error ?? 'Não foi possível concluir a meta')
      return
    }

    toast.success('Meta concluída!')
    await mutate()
    await mutateGoalDetails()
    setDetailsOpen(false)
  }, [mutate, mutateGoalDetails, selectedGoalId])

  const handleEditGoal = useCallback(
    async (values: GoalFormSchema) => {
      if (!selectedGoalId) {
        toast.error('Selecione uma meta para editar')
        throw new Error('Meta não selecionada')
      }

      const response = await fetch(`/api/athletes/${athleteId}/goals/${selectedGoalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error ?? 'Não foi possível editar a meta'
        toast.error(message)
        throw new Error(message)
      }

      toast.success('Meta editada com sucesso!')
      await mutate()
      await mutateGoalDetails()
    },
    [athleteId, mutate, mutateGoalDetails, selectedGoalId]
  )

  const handleDeleteGoal = useCallback(async () => {
    if (!selectedGoalId) return

    const response = await fetch(`/api/athletes/${athleteId}/goals/${selectedGoalId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      toast.error(payload?.error ?? 'Não foi possível deletar a meta')
      return
    }

    toast.success('Meta deletada com sucesso!')
    await mutate()
    setDetailsOpen(false)
    setDeleteConfirmOpen(false)
  }, [athleteId, mutate, selectedGoalId])

  // Personal Records handlers
  const handleCreateRecord = useCallback(
    async (values: PersonalRecordFormSchema) => {
      const { createPersonalRecord } = await import('@/actions/personalRecords')
      const result = await createPersonalRecord(athleteId, values)

      if (!result.success) {
        toast.error(result.error ?? 'Não foi possível criar o recorde')
        throw new Error(result.error)
      }

      toast.success('Recorde criado com sucesso!')
      await mutate()
    },
    [athleteId, mutate]
  )

  const handleEditRecord = useCallback(
    async (values: PersonalRecordFormSchema) => {
      if (!selectedRecord) {
        toast.error('Selecione um recorde para editar')
        throw new Error('Recorde não selecionado')
      }

      const { updatePersonalRecord } = await import('@/actions/personalRecords')
      const result = await updatePersonalRecord(selectedRecord.id, athleteId, values)

      if (!result.success) {
        toast.error(result.error ?? 'Não foi possível editar o recorde')
        throw new Error(result.error)
      }

      toast.success('Recorde editado com sucesso!')
      await mutate()
    },
    [athleteId, mutate, selectedRecord]
  )

  const handleDeleteRecord = useCallback(async () => {
    if (!selectedRecord) return

    const { deletePersonalRecord } = await import('@/actions/personalRecords')
    const result = await deletePersonalRecord(selectedRecord.id, athleteId)

    if (!result.success) {
      toast.error(result.error ?? 'Não foi possível deletar o recorde')
      return
    }

    toast.success('Recorde deletado com sucesso!')
    await mutate()
    setDeleteRecordConfirmOpen(false)
    setSelectedRecord(null)
  }, [athleteId, mutate, selectedRecord])

  const currentScreen = useMemo(() => {
    if (!data) return null

    if (currentTab === 'records') {
      return (
        <PersonalRecordsScreen
          records={data.personalRecords}
          onCreateRecord={() => setNewRecordOpen(true)}
          onEditRecord={(record) => {
            setSelectedRecord(record)
            setEditRecordOpen(true)
          }}
          onDeleteRecord={(record) => {
            setSelectedRecord(record)
            setDeleteRecordConfirmOpen(true)
          }}
        />
      )
    }

    if (currentTab === 'history') {
      return <HistoryTimelineScreen history={data.history} onSelectGoal={handleSelectGoal} />
    }

    return (
      <ActiveGoalsScreen
        goals={data.activeGoals}
        onSelectGoal={handleSelectGoal}
        onCreateGoal={() => setNewGoalOpen(true)}
      />
    )
  }, [currentTab, data])

  const handleFabClick = () => {
    if (currentTab === 'records') {
      setNewRecordOpen(true)
      return
    }
    setNewGoalOpen(true)
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
        <IconButton onClick={() => router.push(`/dashboard/athletes/${athleteId}`)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {headerTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTab === 'records'
              ? 'Momentos mais marcantes'
              : currentTab === 'history'
                ? 'Linha do tempo das metas'
                : 'Acompanhe as metas em andamento'}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ pb: 12 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">Não foi possível carregar as metas do atleta.</Alert>}

        {!isLoading && !error && data && <Stack spacing={3}>{currentScreen}</Stack>}
      </Box>

      <GoalsBottomNavigation value={currentTab} onChange={setCurrentTab} />

      {currentTab !== 'history' && (
        <FloatingActionButton label="Nova meta" color="warning" onClick={handleFabClick} />
      )}

      <NewGoalDialog
        open={newGoalOpen}
        onClose={() => setNewGoalOpen(false)}
        onSubmit={handleCreateGoal}
      />

      <GoalDetailsScreen
        goal={goalDetails}
        open={detailsOpen}
        loading={goalLoading}
        onClose={() => setDetailsOpen(false)}
        onEdit={() => setEditGoalOpen(true)}
        onDelete={() => setDeleteConfirmOpen(true)}
        onUpdateProgress={() => setProgressOpen(true)}
        onMarkAsCompleted={handleCompleteGoal}
      />

      <EditGoalDialog
        open={editGoalOpen}
        goal={goalDetails}
        onClose={() => setEditGoalOpen(false)}
        onSubmit={handleEditGoal}
      />

      <UpdateProgressDialog
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        onSubmit={handleProgressSubmit}
        unit={goalDetails?.unit ?? data?.activeGoals[0]?.unit ?? 'un'}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Deletar Meta"
        message={`Tem certeza que deseja deletar a meta "${goalDetails?.title}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteGoal}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmText="Deletar"
        confirmColor="error"
      />

      {/* Personal Records Dialogs */}
      <NewPersonalRecordDialog
        open={newRecordOpen}
        onClose={() => setNewRecordOpen(false)}
        onSubmit={handleCreateRecord}
      />

      <EditPersonalRecordDialog
        open={editRecordOpen}
        record={selectedRecord}
        onClose={() => setEditRecordOpen(false)}
        onSubmit={handleEditRecord}
      />

      <ConfirmDialog
        open={deleteRecordConfirmOpen}
        title="Deletar Recorde"
        message={`Tem certeza que deseja deletar o recorde "${selectedRecord?.title}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteRecord}
        onCancel={() => setDeleteRecordConfirmOpen(false)}
        confirmText="Deletar"
        confirmColor="error"
      />
    </Box>
  )
}
