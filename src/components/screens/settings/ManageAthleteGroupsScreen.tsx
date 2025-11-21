'use client'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import { Add, Delete, Edit, EmojiPeople } from '@mui/icons-material'
import {
  Alert,
  Avatar,
  AvatarGroup,
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
import { AthleteGroupDialog } from './AthleteGroupDialog'

interface Athlete {
  id: number
  name: string
  photo?: string | null
}

interface AthleteGroup {
  id: number
  name: string
  description?: string | null
  members: {
    athlete: Athlete
  }[]
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Erro ao carregar dados')
  return response.json()
}

export function ManageAthleteGroupsScreen() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<AthleteGroup | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: AthleteGroup[] }>(
    '/api/athlete-groups',
    fetcher
  )

  const handleCreate = useCallback(
    async (formData: { name: string; description?: string; athleteIds: number[] }) => {
      const { createAthleteGroup } = await import('@/actions/athleteGroups')
      const result = await createAthleteGroup(formData)

      if (!result.success) {
        toast.error(result.error ?? 'Não foi possível criar o grupo')
        throw new Error(result.error)
      }

      toast.success('Grupo criado com sucesso!')
      await mutate()
    },
    [mutate]
  )

  const handleEdit = useCallback(
    async (formData: { name: string; description?: string; athleteIds: number[] }) => {
      if (!selectedGroup) return

      const { updateAthleteGroup } = await import('@/actions/athleteGroups')
      const result = await updateAthleteGroup(selectedGroup.id, formData)

      if (!result.success) {
        toast.error(result.error ?? 'Não foi possível atualizar o grupo')
        throw new Error(result.error)
      }

      toast.success('Grupo atualizado com sucesso!')
      await mutate()
    },
    [mutate, selectedGroup]
  )

  const handleDelete = useCallback(async () => {
    if (!selectedGroup) return

    const { deleteAthleteGroup } = await import('@/actions/athleteGroups')
    const result = await deleteAthleteGroup(selectedGroup.id)

    if (!result.success) {
      toast.error(result.error ?? 'Não foi possível deletar o grupo')
      return
    }

    toast.success('Grupo deletado com sucesso!')
    await mutate()
    setDeleteConfirmOpen(false)
    setSelectedGroup(null)
  }, [mutate, selectedGroup])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">Não foi possível carregar os grupos.</Alert>
  }

  const groups = data?.data ?? []

  if (groups.length === 0) {
    return (
      <>
        <EmptyState
          icon={<EmojiPeople fontSize="large" color="action" />}
          title="Nenhum grupo cadastrado"
          description="Crie grupos para facilitar o gerenciamento de treinos."
          action={{
            label: 'Adicionar grupo',
            onClick: () => {
              setSelectedGroup(null)
              setDialogOpen(true)
            },
          }}
        />
        <AthleteGroupDialog
          open={dialogOpen}
          group={selectedGroup}
          onClose={() => setDialogOpen(false)}
          onSubmit={selectedGroup ? handleEdit : handleCreate}
        />
      </>
    )
  }

  return (
    <>
      <Stack spacing={2}>
        {groups.map((group) => (
          <Card key={group.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack flex={1} spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {group.name}
                    </Typography>
                    {group.description && (
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {group.description}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      label={`${group.members.length} atletas`}
                      size="small"
                      variant="outlined"
                    />
                    <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 28, height: 28 } }}>
                      {group.members.map((member) => (
                        <Avatar
                          key={member.athlete.id}
                          src={member.athlete.photo ?? undefined}
                          alt={member.athlete.name}
                        >
                          {member.athlete.name[0]}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedGroup(group)
                      setDialogOpen(true)
                    }}
                    sx={{ color: 'primary.main' }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedGroup(group)
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
        label="Novo grupo"
        color="primary"
        icon={<Add />}
        onClick={() => {
          setSelectedGroup(null)
          setDialogOpen(true)
        }}
      />

      <AthleteGroupDialog
        open={dialogOpen}
        group={selectedGroup}
        onClose={() => setDialogOpen(false)}
        onSubmit={selectedGroup ? handleEdit : handleCreate}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Deletar Grupo"
        message={`Tem certeza que deseja deletar "${selectedGroup?.name}"? O grupo será removido, mas os atletas permanecerão no sistema.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmText="Deletar"
        confirmColor="error"
      />
    </>
  )
}
