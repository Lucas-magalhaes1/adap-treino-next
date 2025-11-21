'use client'

import { createTrainingModelField, updateTrainingModelField } from '@/actions/trainingModels'
import { LoadingButton } from '@/components/common/LoadingButton'
import type { TrainingModelField } from '@/types/trainingModel'
import { UNIT_OPTIONS } from '@/utils/goalConstants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material'
import {
  AppBar,
  Box,
  Button,
  Dialog,
  FormControlLabel,
  IconButton,
  MenuItem,
  IconButton as MuiIconButton,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

const fieldSchema = z.object({
  label: z.string().min(1, 'Nome é obrigatório'),
  fieldType: z.enum([
    'text',
    'number',
    'boolean',
    'choice',
    'multiple-choice',
    'group',
    'expandable-boolean',
  ]),
  unit: z.string().optional(),
  isRequired: z.boolean(),
  formType: z.enum(['general', 'athlete']),
  // Configurações específicas por tipo
  min: z.number().optional(),
  max: z.number().optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      })
    )
    .optional(),
})

type FieldFormData = z.infer<typeof fieldSchema>

interface FieldConfigDialogProps {
  open: boolean
  onClose: () => void
  field: TrainingModelField | null
  modelId: number
  formType: 'general' | 'athlete'
  fieldCount: number
  parentId?: string | null // Para criar campos dentro de grupos
}

export function FieldConfigDialog({
  open,
  onClose,
  field,
  modelId,
  formType,
  fieldCount,
  parentId,
}: FieldConfigDialogProps) {
  const [isSaving, setIsSaving] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      label: '',
      fieldType: 'text',
      unit: '',
      isRequired: false,
      formType: formType,
      options: [],
    },
  })

  const {
    fields: optionFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'options',
  })

  const selectedFieldType = watch('fieldType')

  // Carregar dados do campo para edição
  useEffect(() => {
    if (field) {
      setValue('label', field.label)
      setValue('fieldType', field.fieldType)
      setValue('unit', field.unit || '')
      setValue('isRequired', field.isRequired)
      setValue('formType', field.formType)

      if (field.config) {
        if (field.config.min !== undefined) setValue('min', field.config.min)
        if (field.config.max !== undefined) setValue('max', field.config.max)
        if (field.config.options) setValue('options', field.config.options)
      }
    } else {
      // Reset ao abrir para criar novo
      reset({
        label: '',
        fieldType: 'text',
        unit: '',
        isRequired: false,
        formType: formType,
        options: [],
      })
    }
  }, [field, formType, setValue, reset])

  const onSubmit = async (data: FieldFormData) => {
    try {
      setIsSaving(true)

      // Montar config baseado no tipo
      const config: any = {}

      if (data.fieldType === 'number') {
        if (data.min !== undefined) config.min = data.min
        if (data.max !== undefined) config.max = data.max
      }

      if ((data.fieldType === 'choice' || data.fieldType === 'multiple-choice') && data.options) {
        config.options = data.options
      }

      if (field) {
        // Editar campo existente
        await updateTrainingModelField(Number(field.id), {
          label: data.label,
          fieldType: data.fieldType,
          unit: data.unit || undefined,
          isRequired: data.isRequired,
          formType: data.formType,
          config,
        })
      } else {
        // Criar novo campo
        const key = data.label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

        await createTrainingModelField({
          trainingModelId: modelId,
          key,
          label: data.label,
          fieldType: data.fieldType,
          unit: data.unit || undefined,
          sortOrder: fieldCount,
          isRequired: data.isRequired,
          formType: data.formType,
          parentId: parentId ? Number(parentId) : null, // Passar parentId se for campo de grupo
          config,
        })
      }

      onClose()
      reset()
    } catch (error) {
      console.error('Erro ao salvar campo:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddOption = () => {
    append({ id: crypto.randomUUID(), label: '' })
  }

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {field ? 'Editar Campo' : 'Novo Campo'}
          </Typography>
          <LoadingButton onClick={handleSubmit(onSubmit)} loading={isSaving}>
            Salvar
          </LoadingButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, pb: 10 }}>
        {/* Nome do Campo */}
        <Controller
          name="label"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nome do Campo"
              fullWidth
              error={!!errors.label}
              helperText={errors.label?.message}
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Tipo do Campo */}
        <Controller
          name="fieldType"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Tipo do Campo" fullWidth sx={{ mb: 2 }}>
              <MenuItem value="text">Texto</MenuItem>
              <MenuItem value="number">Número</MenuItem>
              <MenuItem value="boolean">Sim/Não</MenuItem>
              <MenuItem value="expandable-boolean">Sim/Não Expansível</MenuItem>
              <MenuItem value="choice">Escolha Única</MenuItem>
              <MenuItem value="multiple-choice">Múltipla Escolha</MenuItem>
              <MenuItem value="group">Grupo</MenuItem>
            </TextField>
          )}
        />

        {/* Unidade (para campos numéricos) */}
        {selectedFieldType === 'number' && (
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Unidade de Medida" fullWidth sx={{ mb: 2 }}>
                <MenuItem value="">Nenhuma</MenuItem>
                {UNIT_OPTIONS.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}

        {/* Obrigatório */}
        <Controller
          name="isRequired"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Campo Obrigatório"
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Configurações específicas por tipo */}
        <Box sx={{ mt: 3 }}>
          {selectedFieldType === 'number' && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Limites (opcional)
              </Typography>
              <Stack direction="row" spacing={2}>
                <Controller
                  name="min"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Valor Mínimo"
                      fullWidth
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  )}
                />
                <Controller
                  name="max"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Valor Máximo"
                      fullWidth
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  )}
                />
              </Stack>
            </Box>
          )}

          {(selectedFieldType === 'choice' || selectedFieldType === 'multiple-choice') && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">Opções</Typography>
                <Button startIcon={<AddIcon />} size="small" onClick={handleAddOption}>
                  Adicionar Opção
                </Button>
              </Box>

              {optionFields.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Nenhuma opção adicionada
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {optionFields.map((item, index) => (
                    <Stack key={item.id} direction="row" spacing={1}>
                      <Controller
                        name={`options.${index}.label`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={`Opção ${index + 1}`}
                            fullWidth
                            size="small"
                          />
                        )}
                      />
                      <MuiIconButton color="error" onClick={() => remove(index)} size="small">
                        <DeleteIcon />
                      </MuiIconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {selectedFieldType === 'expandable-boolean' && (
            <Box>
              <Typography color="text.secondary" variant="body2">
                Os campos dependentes para Sim/Não podem ser configurados após criar este campo
              </Typography>
            </Box>
          )}

          {selectedFieldType === 'group' && (
            <Box>
              <Typography color="text.secondary" variant="body2">
                Após criar o Grupo, você poderá adicionar campos dentro dele clicando no botão "+"
                dentro do card do grupo.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}
