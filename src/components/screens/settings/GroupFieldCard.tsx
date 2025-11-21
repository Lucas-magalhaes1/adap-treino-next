'use client'

import { reorderTrainingModelFields } from '@/actions/trainingModels'
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
import {
  Add as AddIcon,
  CheckBox as CheckBoxIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

// Componente para campos dentro do grupo (nested sortable)
function GroupChildFieldItem({
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
      default:
        return field.fieldType
    }
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
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
          <DragIndicatorIcon fontSize="small" />
        </Box>

        {/* Field Info */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            {field.label}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={getFieldTypeLabel()} size="small" sx={{ height: 20, fontSize: 11 }} />
            {field.unit && (
              <Chip
                label={field.unit}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
            )}
            {field.isRequired && (
              <Chip
                label="Obrigatório"
                size="small"
                color="error"
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
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
    </Box>
  )
}

interface GroupFieldCardProps {
  group: TrainingModelField
  childFields: TrainingModelField[]
  onEdit: (field: TrainingModelField) => void
  onDelete: (fieldId: string) => void
  onAddChildField: (parentId: string) => void
  onReorderChildren: (children: TrainingModelField[]) => void
}

export function GroupFieldCard({
  group,
  childFields,
  onEdit,
  onDelete,
  onAddChildField,
  onReorderChildren,
}: GroupFieldCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [localChildren, setLocalChildren] = useState(childFields)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Configurar sensores para nested drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
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
      const oldIndex = localChildren.findIndex((f) => f.id === active.id)
      const newIndex = localChildren.findIndex((f) => f.id === over.id)

      const reorderedChildren = arrayMove(localChildren, oldIndex, newIndex)

      // Atualizar sortOrder
      const updatedChildren = reorderedChildren.map((field, index) => ({
        ...field,
        sortOrder: index,
      }))

      setLocalChildren(updatedChildren)
      onReorderChildren(updatedChildren)

      // Persistir no banco
      try {
        await reorderTrainingModelFields(
          updatedChildren.map((f) => ({
            id: Number(f.id),
            sortOrder: f.sortOrder,
          }))
        )
      } catch (error) {
        console.error('Erro ao reordenar campos do grupo:', error)
      }
    }
  }

  // Atualizar localChildren quando childFields mudar (useEffect em vez de useState)
  useEffect(() => {
    setLocalChildren(childFields)
  }, [childFields])

  return (
    <Card ref={setNodeRef} style={style} sx={{ mb: 1 }} elevation={3}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1}>
          {/* Header do Grupo */}
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

            {/* Group Icon */}
            <Box sx={{ color: 'primary.main', display: 'flex' }}>
              {group.fieldType === 'expandable-boolean' ? <CheckBoxIcon /> : <FolderIcon />}
            </Box>

            {/* Group Info */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={600}>
                {group.label}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={group.fieldType === 'expandable-boolean' ? 'Sim/Não Expansível' : 'Grupo'}
                  size="small"
                  color="primary"
                />
                <Typography variant="caption" color="text.secondary">
                  {localChildren.length} {localChildren.length === 1 ? 'campo' : 'campos'}
                </Typography>
              </Stack>
            </Box>

            {/* Expand Button */}
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>

            {/* Actions */}
            <IconButton size="small" onClick={() => onEdit(group)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(group.id)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Campos do Grupo (Nested Sortable) */}
          <Collapse in={expanded}>
            <Box sx={{ pl: 4, pt: 1 }}>
              {localChildren.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Nenhum campo dentro deste grupo
                </Typography>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localChildren.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localChildren.map((field) => (
                      <GroupChildFieldItem
                        key={field.id}
                        field={field}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}

              {/* Botão para adicionar campo ao grupo */}
              <Button
                startIcon={<AddIcon />}
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => onAddChildField(group.id)}
                sx={{ mt: 1 }}
              >
                Adicionar Campo ao Grupo
              </Button>
            </Box>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  )
}
