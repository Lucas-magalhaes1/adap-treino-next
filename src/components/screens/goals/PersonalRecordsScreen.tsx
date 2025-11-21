'use client'

import { PersonalRecordSummary } from '@/types/goal'
import { formatValueByUnit } from '@/utils/goalFormatters'
import { Delete, Edit, EmojiEvents } from '@mui/icons-material'
import { Card, CardContent, IconButton, Stack, Typography } from '@mui/material'
import { EmptyState } from '../../common/EmptyState'

interface PersonalRecordsScreenProps {
  records: PersonalRecordSummary[]
  onCreateRecord: () => void
  onEditRecord: (record: PersonalRecordSummary) => void
  onDeleteRecord: (record: PersonalRecordSummary) => void
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function PersonalRecordsScreen({
  records,
  onCreateRecord,
  onEditRecord,
  onDeleteRecord,
}: PersonalRecordsScreenProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<EmojiEvents fontSize="large" color="warning" />}
        title="Nenhum recorde registrado"
        description="Registre um recorde pessoal para acompanhar as evoluções mais marcantes."
        action={{ label: 'Adicionar recorde', onClick: onCreateRecord }}
      />
    )
  }

  return (
    <Stack spacing={2}>
      {records.map((record) => (
        <Card key={record.id} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack flex={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {record.title}
                </Typography>
                <Typography variant="h5" fontWeight={700} mt={1}>
                  {formatValueByUnit(record.value, record.unit)} {record.unit}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(record.dateAchieved)}
                </Typography>
                {record.notes && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {record.notes}
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => onEditRecord(record)}
                  sx={{ color: 'primary.main' }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDeleteRecord(record)}
                  sx={{ color: 'error.main' }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
