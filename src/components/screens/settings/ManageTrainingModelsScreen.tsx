'use client'

import { EmptyState } from '@/components/common/EmptyState'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'
import type { TrainingModelSummary } from '@/types/trainingModel'
import {
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ManageTrainingModelsScreenProps {
  onBack: () => void
  onSelectModel: (modelId: number | null) => void
}

export default function ManageTrainingModelsScreen({
  onBack,
  onSelectModel,
}: ManageTrainingModelsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [modelToDelete, setModelToDelete] = useState<TrainingModelSummary | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<{
    message: string
    severity: 'success' | 'error'
  } | null>(null)

  const {
    data: models,
    isLoading,
    mutate,
  } = useSWR<TrainingModelSummary[]>('/api/training-models', fetcher)

  // Filtrar modelos baseado na busca
  const filteredModels = models?.filter((model) => {
    const query = searchQuery.toLowerCase()
    return (
      model.name.toLowerCase().includes(query) ||
      model.sport.name.toLowerCase().includes(query) ||
      model.description?.toLowerCase().includes(query)
    )
  })

  const handleCreateNew = () => {
    onSelectModel(null)
  }

  const handleEditModel = (modelId: number) => {
    onSelectModel(modelId)
  }

  const handleOpenDeleteDialog = (model: TrainingModelSummary) => {
    setModelToDelete(model)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setModelToDelete(null)
  }

  const handleDeleteModel = async () => {
    if (!modelToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/training-models/${modelToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Falha ao excluir modelo')
      }

      await mutate()
      setFeedback({ message: 'Modelo enviado para a lixeira', severity: 'success' })
      handleCloseDeleteDialog()
    } catch (error) {
      console.error(error)
      setFeedback({ message: 'Não foi possível excluir o modelo', severity: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseFeedback = () => {
    setFeedback(null)
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Modelos de Treino
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto', pb: 10 }}>
        {/* Barra de busca */}
        <TextField
          fullWidth
          placeholder="Buscar por nome, esporte ou descrição..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />

        {/* Lista de modelos */}
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">Carregando...</Typography>
          </Box>
        ) : filteredModels && filteredModels.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredModels.map((model) => (
              <Card key={model.id} elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="h6">{model.name}</Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Esporte: <strong>{model.sport.name}</strong>
                  </Typography>

                  {model.description && (
                    <Typography variant="body2" color="text.secondary">
                      {model.description}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {model._count.fields} {model._count.fields === 1 ? 'campo' : 'campos'}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(model)}
                    sx={{ mr: 1 }}
                  >
                    Excluir
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => handleEditModel(model.id)}>
                    Editar
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : (
          <EmptyState
            icon={<DescriptionIcon sx={{ fontSize: 64 }} />}
            title={searchQuery ? 'Nenhum modelo encontrado' : 'Nenhum modelo de treino cadastrado'}
            description={
              searchQuery
                ? 'Tente buscar com outros termos'
                : 'Crie seu primeiro modelo de treino para organizar seus treinos'
            }
          />
        )}
      </Box>

      <FloatingActionButton onClick={handleCreateNew} label="Novo Modelo" />

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog} fullWidth>
        <DialogTitle>Excluir modelo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Tem certeza de que deseja excluir o modelo "${modelToDelete?.name}"? Os treinos existentes continuarão mostrando os dados desse modelo, mas ele não aparecerá mais para novos treinos.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteModel} color="error" disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseFeedback} severity={feedback?.severity} sx={{ width: '100%' }}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
