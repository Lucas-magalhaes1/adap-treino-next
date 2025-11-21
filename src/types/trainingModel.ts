export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'choice'
  | 'multiple-choice'
  | 'group'
  | 'expandable-boolean'

export interface FieldOption {
  id: string
  label: string
}

export interface TrainingModelField {
  id: string
  key: string
  label: string
  fieldType: FieldType
  unit?: string
  sortOrder: number
  isRequired: boolean
  config?: {
    min?: number
    max?: number
    options?: FieldOption[]
    expandableTrue?: TrainingModelField[]
    expandableFalse?: TrainingModelField[]
  }
  formType: 'general' | 'athlete'
  parentId: string | null // Para suportar hierarquia (Padrão Composite)
}

export interface TrainingModelSummary {
  id: number
  name: string
  description?: string
  sport: {
    id: number
    name: string
  }
  _count: {
    fields: number
  }
}

export interface TrainingModelDetail {
  id: number
  name: string
  description?: string
  sportId: number
  sport: {
    id: number
    name: string
  }
  fields: TrainingModelField[]
}
