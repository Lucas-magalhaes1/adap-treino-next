'use client'

import type { TrainingModelField } from '@/types/trainingModel'
import { Folder as FolderIcon } from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface AthleteFormProps {
  athleteId: number
  athleteName: string
  fields: TrainingModelField[]
  initialValues?: Record<string, any>
  onValuesChange?: (athleteId: number, values: Record<string, any>) => void
}

export interface AthleteFormRef {
  getValues: () => Record<string, any>
  handleSubmit: (
    onValid: (data: Record<string, any>) => void,
    onInvalid?: (errors: any) => void
  ) => void
  trigger: (name?: string | string[]) => Promise<boolean>
}

export const AthleteForm = forwardRef<AthleteFormRef, AthleteFormProps>(
  ({ athleteId, fields, initialValues, onValuesChange }, ref) => {
    const hasInitialized = useRef(false)

    const {
      control,
      handleSubmit,
      getValues,
      formState: { errors },
      reset,
      trigger,
    } = useForm({
      defaultValues: initialValues || {},
    })

    useImperativeHandle(ref, () => ({
      getValues: () => getValues(),
      handleSubmit: (onValid, onInvalid) => {
        handleSubmit(onValid, onInvalid)()
      },
      trigger: (name) => trigger(name),
    }))

    // Carregar valores iniciais APENAS na montagem do componente
    useEffect(() => {
      if (!hasInitialized.current) {
        if (initialValues && Object.keys(initialValues).length > 0) {
          reset(initialValues)
        }
        hasInitialized.current = true
      }
    }, [initialValues, reset])

    const notifyValuesChange = useCallback(() => {
      if (onValuesChange) {
        onValuesChange(athleteId, getValues())
      }
    }, [athleteId, getValues, onValuesChange])

    const handleFieldBlur = useCallback(
      (originalOnBlur?: (...args: any[]) => void) =>
        (...args: any[]) => {
          originalOnBlur?.(...args)
          notifyValuesChange()
        },
      [notifyValuesChange]
    )

    const renderField = (field: TrainingModelField): React.ReactNode => {
      const fieldKey = field.key

      switch (field.fieldType) {
        case 'text':
          return (
            <Controller
              key={fieldKey}
              name={fieldKey}
              control={control}
              rules={{ required: field.isRequired ? `${field.label} é obrigatório` : false }}
              defaultValue=""
              render={({ field: controllerField }) => (
                <TextField
                  {...controllerField}
                  label={field.label}
                  required={field.isRequired}
                  fullWidth
                  error={!!errors?.[fieldKey]}
                  helperText={errors?.[fieldKey]?.message as string}
                  onBlur={handleFieldBlur(controllerField.onBlur)}
                  sx={{ mb: 2 }}
                />
              )}
            />
          )

        case 'number':
          return (
            <Controller
              key={fieldKey}
              name={fieldKey}
              control={control}
              rules={{ required: field.isRequired ? `${field.label} é obrigatório` : false }}
              defaultValue=""
              render={({ field: controllerField }) => (
                <TextField
                  {...controllerField}
                  label={field.label}
                  type="number"
                  required={field.isRequired}
                  fullWidth
                  error={!!errors?.[fieldKey]}
                  helperText={errors?.[fieldKey]?.message as string}
                  InputProps={{
                    endAdornment: field.unit ? (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {field.unit}
                      </Typography>
                    ) : undefined,
                  }}
                  inputProps={{
                    min: field.config?.min,
                    max: field.config?.max,
                  }}
                  onChange={(e) => controllerField.onChange(Number(e.target.value))}
                  onBlur={handleFieldBlur(controllerField.onBlur)}
                  sx={{ mb: 2 }}
                />
              )}
            />
          )

        case 'boolean':
          return (
            <Controller
              key={fieldKey}
              name={fieldKey}
              control={control}
              defaultValue={false}
              render={({ field: controllerField }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={controllerField.value || false}
                      onChange={(e) => {
                        controllerField.onChange(e.target.checked)
                        notifyValuesChange()
                      }}
                      onBlur={handleFieldBlur(controllerField.onBlur)}
                    />
                  }
                  label={field.label}
                  sx={{ mb: 2 }}
                />
              )}
            />
          )

        case 'choice':
          return (
            <Controller
              key={fieldKey}
              name={fieldKey}
              control={control}
              rules={{ required: field.isRequired ? `${field.label} é obrigatório` : false }}
              defaultValue=""
              render={({ field: controllerField }) => (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1 }}
                    color={errors?.[fieldKey] ? 'error' : 'inherit'}
                  >
                    {field.label} {field.isRequired && '*'}
                  </Typography>
                  <RadioGroup
                    {...controllerField}
                    onChange={(event, value) => {
                      controllerField.onChange(value)
                      notifyValuesChange()
                    }}
                    onBlur={handleFieldBlur(controllerField.onBlur)}
                  >
                    {field.config?.options?.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.id}
                        control={<Radio />}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                  {errors?.[fieldKey] && (
                    <Typography variant="caption" color="error">
                      {errors[fieldKey]?.message as string}
                    </Typography>
                  )}
                </Box>
              )}
            />
          )

        case 'multiple-choice':
          return (
            <Controller
              key={fieldKey}
              name={fieldKey}
              control={control}
              defaultValue={[]}
              render={({ field: controllerField }) => (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {field.label} {field.isRequired && '*'}
                  </Typography>
                  <FormGroup>
                    {field.config?.options?.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        control={
                          <Checkbox
                            checked={controllerField.value?.includes(option.id) || false}
                            onChange={(e) => {
                              const currentValue = controllerField.value || []
                              const newValue = e.target.checked
                                ? [...currentValue, option.id]
                                : currentValue.filter((id: string) => id !== option.id)
                              controllerField.onChange(newValue)
                              notifyValuesChange()
                            }}
                            onBlur={handleFieldBlur(controllerField.onBlur)}
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              )}
            />
          )

        case 'expandable-boolean':
          const childFieldsForBoolean = fields
            .filter((f) => f.parentId === field.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)

          return (
            <Controller
              key={fieldKey}
              name={fieldKey}
              control={control}
              defaultValue={false}
              render={({ field: controllerField }) => (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={controllerField.value || false}
                          onChange={(e) => {
                            controllerField.onChange(e.target.checked)
                            notifyValuesChange()
                          }}
                          onBlur={handleFieldBlur(controllerField.onBlur)}
                        />
                      }
                      label={field.label}
                    />

                    {controllerField.value && childFieldsForBoolean.length > 0 && (
                      <Box sx={{ ml: 4, mt: 2, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: 'block' }}
                        >
                          Campos condicionais:
                        </Typography>
                        {childFieldsForBoolean.map((childField) => renderField(childField))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            />
          )

        case 'group':
          const childFieldsForGroup = fields
            .filter((f) => f.parentId === field.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)

          return (
            <Card key={fieldKey} sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <FolderIcon color="primary" />
                  <Typography variant="h6">{field.label}</Typography>
                </Stack>

                {childFieldsForGroup.length > 0 ? (
                  <Box sx={{ pl: 2 }}>
                    {childFieldsForGroup.map((childField) => renderField(childField))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Nenhum campo neste grupo
                  </Typography>
                )}
              </CardContent>
            </Card>
          )

        default:
          return null
      }
    }

    const topLevelFields = fields
      .filter((f) => f.formType === 'athlete' && f.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    return <Box>{topLevelFields.map((field) => renderField(field))}</Box>
  }
)

AthleteForm.displayName = 'AthleteForm'
