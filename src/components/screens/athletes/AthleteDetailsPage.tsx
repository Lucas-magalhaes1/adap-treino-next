'use client'

import { formatGender, formatHeight, formatWeight } from '@/utils/athleteHelpers'
import { ArrowBack, Edit, EmojiEvents, FolderOpen, Timeline } from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AthleteDocuments } from './AthleteDocuments'

interface AthleteDetailsPageProps {
  athlete: {
    id: number
    name: string
    gender: 'male' | 'female' | 'other' | null
    birthDate?: string
    age?: number
    weight?: number | null
    height?: number | null
    photo?: string | null
    sports: Array<{ id: number; name: string; isMain: boolean }>
    createdAt?: string
    notes?: string
  }
}

export function AthleteDetailsPage({ athlete }: AthleteDetailsPageProps) {
  const router = useRouter()
  const [showDocuments, setShowDocuments] = useState(false)

  const formattedBirthDate = athlete.birthDate
    ? new Date(athlete.birthDate).toLocaleDateString('pt-BR')
    : 'Não informado'

  const formattedCreatedAt = athlete.createdAt
    ? new Date(athlete.createdAt).toLocaleDateString('pt-BR')
    : null

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/dashboard/athletes')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, ml: 1 }}>
            Detalhes do Atleta
          </Typography>
          <Button
            startIcon={<Edit />}
            onClick={() => router.push(`/dashboard/athletes/${athlete.id}/edit`)}
          >
            Editar
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1, p: 3, pb: 8 }}>
        <Stack spacing={3}>
          {/* Perfil */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Avatar
              src={athlete.photo || undefined}
              sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: '3rem', mb: 2 }}
            >
              {athlete.name[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h5" fontWeight="bold">
              {athlete.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatGender(athlete.gender)} ·{' '}
              {athlete.age ? `${athlete.age} anos` : 'Idade não informada'}
            </Typography>

            {athlete.sports.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" mt={2}>
                {athlete.sports.map((sport) => (
                  <Chip
                    key={sport.id}
                    label={sport.name}
                    color={sport.isMain ? 'primary' : 'default'}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* Estatísticas */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Informações Físicas
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Altura
                  </Typography>
                  <Typography variant="h6">{formatHeight(athlete.height)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Peso
                  </Typography>
                  <Typography variant="h6">{formatWeight(athlete.weight)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Nascimento
                  </Typography>
                  <Typography variant="h6">{formattedBirthDate}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Observações */}
          {athlete.notes && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Observações
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {athlete.notes}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Ações rápidas */}
          <Stack spacing={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FolderOpen />}
              onClick={() => setShowDocuments(true)}
            >
              Documentos
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Timeline />}
              onClick={() => router.push(`/dashboard/athletes/${athlete.id}/analytics`)}
            >
              Análise de Progressão
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<EmojiEvents />}
              onClick={() => router.push(`/dashboard/athletes/${athlete.id}/goals`)}
            >
              Ver Metas
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => router.push(`/dashboard/athletes/${athlete.id}/edit`)}
            >
              Editar Atleta
            </Button>
          </Stack>

          {formattedCreatedAt && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Atleta criado em {formattedCreatedAt}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Modal de Documentos */}
      <AthleteDocuments
        athleteId={athlete.id}
        athleteName={athlete.name}
        open={showDocuments}
        onClose={() => setShowDocuments(false)}
      />
    </Box>
  )
}
