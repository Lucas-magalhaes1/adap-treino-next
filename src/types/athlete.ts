/**
 * Tipos relacionados aos Atletas
 */

export interface Athlete {
  id: number
  name: string
  gender?: 'male' | 'female' | 'other' | null
  birthDate?: Date | null
  weight?: number | null
  height?: number | null
  photo?: string | null
  createdAt: Date
}

export interface AthleteSport {
  sportId: number
  sportName: string
  isMain: boolean
}

export interface AthleteWithSports extends Athlete {
  sports: AthleteSport[]
  age?: number
}

export type AthleteGender = 'male' | 'female' | 'other'

export interface CreateAthleteInput {
  name: string
  gender?: AthleteGender
  birthDate?: Date
  weight?: number
  height?: number
  photo?: string
  sportIds?: number[]
}

export interface UpdateAthleteInput extends Partial<CreateAthleteInput> {
  id: number
}
