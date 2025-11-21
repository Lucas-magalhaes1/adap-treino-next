'use client'

import { getPlaceholderByUnit, secondsToTime, timeToSeconds } from '@/utils/goalFormatters'
import { TextField } from '@mui/material'
import { forwardRef } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { IMaskInput } from 'react-imask'

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void
  name: string
}

const TimeMaskInput = forwardRef<HTMLInputElement, CustomProps>(function TimeMaskInput(props, ref) {
  const { onChange, ...other } = props
  return (
    <IMaskInput
      {...other}
      mask="00:00"
      lazy={false}
      overwrite="shift"
      inputRef={ref}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
    />
  )
})

interface GoalValueFieldProps<T extends FieldValues> {
  name: Path<T>
  label: string
  control: Control<T> | Control<any>
  unit: string
  error?: boolean
  helperText?: string
}

/**
 * Campo de valor que adapta seu comportamento baseado na unidade selecionada
 * - Para 'min': aceita formato MM:SS e salva em segundos totais (int)
 * - Para outras unidades: campo numérico padrão (decimal)
 */
export function GoalValueField<T extends FieldValues>({
  name,
  label,
  control,
  unit,
  error,
  helperText,
}: GoalValueFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, ...field } }) => {
        const isTimeUnit = unit === 'min'

        // Para tempo: converte segundos (int) -> MM:SS (string)
        // Para outros: mantém o número
        const displayValue = isTimeUnit && typeof value === 'number' ? secondsToTime(value) : value

        return (
          <TextField
            {...field}
            value={displayValue}
            onChange={(e) => {
              if (isTimeUnit) {
                const timeStr = e.target.value
                // Converte MM:SS -> segundos totais
                const totalSeconds = timeToSeconds(timeStr)
                onChange(totalSeconds)
              } else {
                onChange(parseFloat(e.target.value) || 0)
              }
            }}
            type={isTimeUnit ? 'text' : 'number'}
            label={label}
            placeholder={getPlaceholderByUnit(unit)}
            fullWidth
            error={error}
            helperText={helperText}
            inputProps={isTimeUnit ? {} : { step: '0.1' }}
            slotProps={{
              input: {
                endAdornment: unit,
                ...(isTimeUnit && {
                  inputComponent: TimeMaskInput as any,
                }),
              },
            }}
          />
        )
      }}
    />
  )
}
