export type GoalStatus = 'active' | 'completed' | 'expired'

export interface GoalHistoryEntry {
  id: number
  value: number
  notes?: string
  date: string
}

export interface GoalSummary {
  id: number
  title: string
  unit: string
  startValue: number | null
  currentValue: number | null
  targetValue: number
  targetDate: string | null
  status: GoalStatus
  progressPercentage: number
  lastUpdate: string
}

export interface GoalDetail extends GoalSummary {
  strategyNotes?: string
  startDate: string
  updatedAt: string
  history: GoalHistoryEntry[]
}

export interface PersonalRecordSummary {
  id: number
  title: string
  value: number
  unit: string
  dateAchieved: string
  notes?: string
}

export interface GoalTimelineEntry {
  id: number
  title: string
  status: GoalStatus
  date: string
}

export interface GoalsDashboardResponse {
  athlete: {
    id: number
    name: string
  }
  activeGoals: GoalSummary[]
  history: GoalTimelineEntry[]
  personalRecords: PersonalRecordSummary[]
}
