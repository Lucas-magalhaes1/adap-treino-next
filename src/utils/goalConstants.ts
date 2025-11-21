/**
 * Constantes para unidades de medida e configurações de metas
 */

export const UNIT_OPTIONS = ['kg', 'km', 'min', 'm', 'rep'] as const

export type UnitType = (typeof UNIT_OPTIONS)[number]

export const UNIT_LABELS: Record<UnitType, string> = {
  kg: 'Quilogramas',
  km: 'Quilômetros',
  min: 'Minutos',
  m: 'Metros',
  rep: 'Repetições',
}

export const GOAL_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
} as const

export type GoalStatus = (typeof GOAL_STATUS)[keyof typeof GOAL_STATUS]
