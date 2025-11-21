/**
 * Conversão e formatação de valores para diferentes unidades de medida
 */

// Convert MM:SS to total seconds
export const timeToSeconds = (value: string): number => {
  const parts = value.split(':')
  if (parts.length !== 2) return 0
  const minutes = parseInt(parts[0], 10) || 0
  const seconds = parseInt(parts[1], 10) || 0
  return minutes * 60 + seconds
}

// Convert total seconds to MM:SS
export const secondsToTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Format value for display based on unit (handling time conversion)
export const formatValueByUnit = (value: number, unit: string): string => {
  if (unit === 'min') {
    return secondsToTime(value)
  }
  return value.toString()
}

// Helper to get placeholder text based on unit
export const getPlaceholderByUnit = (unit: string): string => {
  switch (unit) {
    case 'kg':
      return 'Ex: 80.0'
    case 'km':
      return 'Ex: 5.25'
    case 'm':
      return 'Ex: 100'
    case 'min':
      return '12:30'
    case 'rep':
      return 'Ex: 15'
    default:
      return 'Ex: 80'
  }
}

// Format display value based on unit
export const formatDisplayValue = (value: number, unit: string): string => {
  switch (unit) {
    case 'kg':
      return `${value.toFixed(1)} kg`
    case 'km':
      return `${value.toFixed(2)} km`
    case 'm':
      return `${value.toFixed(0)} m`
    case 'min':
      return secondsToTime(value)
    case 'rep':
      return `${Math.round(value)} reps`
    default:
      return value.toString()
  }
}
