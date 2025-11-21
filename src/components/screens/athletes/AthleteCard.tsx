'use client'

import { Avatar, Box, Card, CardActionArea, Stack, Typography } from '@mui/material'

interface AthleteCardProps {
  id: number
  name: string
  photo?: string | null
  age?: number
  sports: string[]
  onClick?: () => void
}

export function AthleteCard({ id, name, photo, age, sports, onClick }: AthleteCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        backgroundColor: 'rgba(255, 200, 180, 0.3)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 2.5 }}>
        <Stack alignItems="center" spacing={1.5}>
          {/* Avatar do atleta */}
          <Avatar
            src={photo || undefined}
            alt={name}
            sx={{
              width: 80,
              height: 80,
              border: '3px solid',
              borderColor: 'background.paper',
              boxShadow: 2,
            }}
          >
            {!photo && name.charAt(0).toUpperCase()}
          </Avatar>

          {/* Nome do atleta */}
          <Typography variant="h6" component="h3" fontWeight="600" textAlign="center">
            {name}
          </Typography>

          {/* Esportes */}
          {sports.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
              {sports.map((sport, index) => (
                <Typography
                  key={index}
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem' }}
                >
                  {sport}
                  {index < sports.length - 1 && ', '}
                </Typography>
              ))}
            </Box>
          )}

          {/* Idade */}
          {age !== undefined && (
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              {age} anos
            </Typography>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  )
}
