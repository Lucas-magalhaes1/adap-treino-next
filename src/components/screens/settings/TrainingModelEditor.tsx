'use client'

import {
  createTrainingModel,
  deleteTrainingModelField,
  getAllSports,
  getTrainingModelById,
  reorderTrainingModelFields,
  updateTrainingModel,
} from '@/actions/trainingModels'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { LoadingButton } from '@/components/common/LoadingButton'
import type { TrainingModelField } from '@/types/trainingModel'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  Numbers as NumbersIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  TextFields as TextFieldsIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import useSWR from 'swr'
import { z } from 'zod'
import { FieldConfigDialog } from './FieldConfigDialog'
import { GroupFieldCard } from './GroupFieldCard'

const modelSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  sportId: z.number().min(1, 'Esporte é obrigatório'),
})

type ModelFormData = z.infer<typeof modelSchema>

interface TrainingModelEditorProps {
  modelId: number | null
  onBack: () => void
}

// Componente para cada campo sortable
function SortableFieldItem({
  field,
  onEdit,
  onDelete,
}: {
  field: TrainingModelField
  onEdit: (field: TrainingModelField) => void
  onDelete: (fieldId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getFieldIcon = () => {
    switch (field.fieldType) {
      case 'text':
        return <TextFieldsIcon />
      case 'number':
        return <NumbersIcon />
      case 'boolean':
      case 'expandable-boolean':
        return <CheckBoxIcon />
      case 'choice':
        return <RadioButtonCheckedIcon />
      case 'multiple-choice':
        return <CheckBoxOutlineBlankIcon />
      case 'group':
        return <FolderIcon />
      default:
        return <TextFieldsIcon />
    }
  }

  const getFieldTypeLabel = () => {
    switch (field.fieldType) {
      case 'text':
        return 'Texto'
      case 'number':
        return 'Número'
      case 'boolean':
        return 'Sim/Não'
      case 'expandable-boolean':
        return 'Sim/Não Expansível'
      case 'choice':
        return 'Escolha Única'
      case 'multiple-choice':
        return 'Múltipla Escolha'
      case 'group':
        return 'Grupo'
      default:
        return field.fieldType
    }
  }

  return (
    <Card ref={setNodeRef} style={style} sx={{ mb: 1 }} elevation={2}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Drag Handle */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: isDragging ? 'grabbing' : 'grab',
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              touchAction: 'none',
            }}
          >
            <DragIndicatorIcon />
          </Box>

          {/* Field Icon */}
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{getFieldIcon()}</Box>

          {/* Field Info */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={600}>
              {field.label}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={getFieldTypeLabel()} size="small" />
              {field.unit && <Chip label={field.unit} size="small" variant="outlined" />}
              {field.isRequired && (
                <Chip label="Obrigatório" size="small" color="error" variant="outlined" />
              )}
            </Stack>
          </Box>

          {/* Actions */}
          <IconButton size="small" onClick={() => onEdit(field)} color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(field.id)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function TrainingModelEditor({ modelId, onBack }: TrainingModelEditorProps) {
  const [currentTab, setCurrentTab] = useState<'general' | 'athlete'>('general')
  const [fields, setFields] = useState<TrainingModelField[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<TrainingModelField | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null)
  const [parentIdForNewField, setParentIdForNewField] = useState<string | null>(null) // Para adicionar campos dentro de grupos

  const { data: sports } = useSWR('sports', getAllSports)
  const {
    data: modelData,
    isLoading,
    mutate,
  } = useSWR(modelId ? `training-model-${modelId}` : null, () =>
    modelId ? getTrainingModelById(modelId) : null
  )

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: '',
      description: '',
      sportId: 0,
    },
  })

  // Carregar dados do modelo para edição
  useEffect(() => {
    if (modelData) {
      setValue('name', modelData.name)
      setValue('description', modelData.description || '')
      setValue('sportId', modelData.sportId)
      setFields(modelData.fields)
    }
  }, [modelData, setValue])

  // Configurar sensores do dnd-kit com TouchSensor otimizado
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      // Ativar após 250ms de hold OU 10px de movimento
      activationConstraint: {
        delay: 250,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Filtrar apenas campos raiz (sem parentId) do tab atual
      const currentFields = fields.filter((f) => f.formType === currentTab && f.parentId === null)
      const oldIndex = currentFields.findIndex((f) => f.id === active.id)
      const newIndex = currentFields.findIndex((f) => f.id === over.id)

      const reorderedFields = arrayMove(currentFields, oldIndex, newIndex)

      // Atualizar sortOrder
      const updatedFields = reorderedFields.map((field, index) => ({
        ...field,
        sortOrder: index,
      }))

      // Atualizar estado local mantendo outros campos
      const otherFields = fields.filter((f) => f.formType !== currentTab || f.parentId !== null)
      setFields([...otherFields, ...updatedFields])

      // Persistir no banco se for edição
      if (modelId) {
        try {
          await reorderTrainingModelFields(
            updatedFields.map((f) => ({
              id: Number(f.id),
              sortOrder: f.sortOrder,
            }))
          )
        } catch (error) {
          console.error('Erro ao reordenar campos:', error)
        }
      }
    }
  }

  const onSubmit = async (data: ModelFormData) => {
    try {
      setIsSaving(true)
      if (modelId) {
        await updateTrainingModel(modelId, data)
      } else {
        await createTrainingModel(data)
      }
      onBack()
    } catch (error) {
      console.error('Erro ao salvar modelo:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddField = () => {
    setSelectedField(null)
    setParentIdForNewField(null) // Campo raiz
    setFieldDialogOpen(true)
  }

  const handleAddChildField = (parentId: string) => {
    setSelectedField(null)
    setParentIdForNewField(parentId) // Campo dentro de grupo
    setFieldDialogOpen(true)
  }

  const handleEditField = (field: TrainingModelField) => {
    setSelectedField(field)
    setParentIdForNewField(null)
    setFieldDialogOpen(true)
  }

  const handleDeleteField = (fieldId: string) => {
    setFieldToDelete(fieldId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteField = async () => {
    if (!fieldToDelete) return

    try {
      await deleteTrainingModelField(Number(fieldToDelete))
      setDeleteDialogOpen(false)
      setFieldToDelete(null)
      // Recarregar dados
      if (modelId) {
        mutate()
      }
    } catch (error) {
      console.error('Erro ao deletar campo:', error)
    }
  }

  const handleCloseFieldDialog = () => {
    setFieldDialogOpen(false)
    setSelectedField(null)
    setParentIdForNewField(null)
    // Recarregar dados
    if (modelId) {
      mutate()
    }
  }

  const handleReorderChildren = (children: TrainingModelField[]) => {
    // Atualizar estado local com novos filhos reordenados
    const otherFields = fields.filter((f) => !children.some((c) => c.id === f.id))
    setFields([...otherFields, ...children])
  }

  const currentFields = fields
    .filter((f) => f.formType === currentTab && f.parentId === null) // Apenas campos raiz
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (isLoading && modelId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {modelId ? 'Editar Modelo' : 'Novo Modelo'}
          </Typography>
          <LoadingButton onClick={handleSubmit(onSubmit)} loading={isSaving}>
            Salvar
          </LoadingButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', pb: 10 }}>
        <Box sx={{ p: 2 }}>
          {/* Informações Básicas */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Informações Básicas
              </Typography>

              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome do Modelo"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    sx={{ mb: 2 }}
                  />
                )}
              />

              <Controller
                name="sportId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Esporte"
                    fullWidth
                    error={!!errors.sportId}
                    helperText={errors.sportId?.message}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value={0} disabled>
                      Selecione um esporte
                    </MenuItem>
                    {sports?.map((sport) => (
                      <MenuItem key={sport.id} value={sport.id}>
                        {sport.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Descrição (opcional)" fullWidth multiline rows={3} />
                )}
              />
            </CardContent>
          </Card>

          {/* Tabs de Formulários */}
          <Card>
            <Tabs
              value={currentTab}
              onChange={(_, value) => setCurrentTab(value)}
              variant="fullWidth"
            >
              <Tab label="Formulário Geral" value="general" />
              <Tab label="Formulário do Atleta" value="athlete" />
            </Tabs>

            <CardContent>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Campos</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={handleAddField}
                  disabled={!modelId}
                >
                  Adicionar Campo
                </Button>
              </Box>

              {!modelId ? (
                <Typography color="text.secondary" variant="body2">
                  Salve o modelo primeiro para adicionar campos
                </Typography>
              ) : currentFields.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Nenhum campo adicionado ainda
                </Typography>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentFields.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {currentFields.map((field) => {
                      // Se for um Grupo OU Sim/Não Expansível, renderizar GroupFieldCard
                      if (field.fieldType === 'group' || field.fieldType === 'expandable-boolean') {
                        const childFields = fields
                          .filter((f) => f.parentId === field.id && f.formType === currentTab)
                          .sort((a, b) => a.sortOrder - b.sortOrder)

                        return (
                          <GroupFieldCard
                            key={field.id}
                            group={field}
                            childFields={childFields}
                            onEdit={handleEditField}
                            onDelete={handleDeleteField}
                            onAddChildField={handleAddChildField}
                            onReorderChildren={handleReorderChildren}
                          />
                        )
                      }

                      // Senão, renderizar campo normal
                      return (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          onEdit={handleEditField}
                          onDelete={handleDeleteField}
                        />
                      )
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Dialog para adicionar/editar campo */}
      {modelId && (
        <FieldConfigDialog
          open={fieldDialogOpen}
          onClose={handleCloseFieldDialog}
          field={selectedField}
          modelId={modelId}
          formType={currentTab}
          fieldCount={currentFields.length}
          parentId={parentIdForNewField}
        />
      )}

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Excluir Campo"
        message="Tem certeza que deseja excluir este campo? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteField}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setFieldToDelete(null)
        }}
      />
    </Box>
  )
}
