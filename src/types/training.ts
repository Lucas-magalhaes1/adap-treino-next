import type { TrainingModelField } from './trainingModel'

export interface TrainingSnapshot {
  modelId: number
  modelName: string
  sportId: number
  sportName: string
  fields: TrainingModelField[]
}

export interface TrainingData {
  snapshot: TrainingSnapshot
  values: Record<string, any>
  athleteValues?: Record<number, Record<string, any>> // valores por atleta (athleteId -> campo -> valor)
  startTime: string
  endTime?: string
  duration?: number // em segundos
}

export interface TrainingSummary {
  id: number
  date: Date
  name?: string
  athleteId: number
  athleteName: string
  athletePhoto?: string
  participants: Array<{
    id: number
    name: string
    photo?: string
  }>
  modelName?: string
  sportName: string
  duration?: number
  status: 'active' | 'completed'
}

export interface TrainingDetail {
  id: number
  date: Date
  notes?: string
  data: TrainingData
  athlete: {
    id: number
    name: string
    photo?: string
  }
  participants: Array<{
    id: number
    name: string
    photo?: string
  }>
  createdAt: Date
  updatedAt: Date
}
