'use client'

import { Box } from '@mui/material'
import { AthleteCard } from './AthleteCard'

interface Athlete {
  id: number
  name: string
  photo?: string | null
  age?: number
  sports: string[]
}

interface AthleteListProps {
  athletes: Athlete[]
  onAthleteClick?: (athleteId: number) => void
}

export function AthleteList({ athletes, onAthleteClick }: AthleteListProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
        },
        gap: 2,
      }}
    >
      {athletes.map((athlete) => (
        <AthleteCard
          key={athlete.id}
          id={athlete.id}
          name={athlete.name}
          photo={athlete.photo}
          age={athlete.age}
          sports={athlete.sports}
          onClick={() => onAthleteClick?.(athlete.id)}
        />
      ))}
    </Box>
  )
}
