'use client'

import { useImageUpload } from '@/hooks/useImageUpload'
import { athleteFormSchema, type AthleteFormData } from '@/schemas/athleteSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowBack, CameraAlt, Edit, Person } from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { AthleteDocumentsSection } from './AthleteDocumentsSection'

interface TempDocument {
  id: string
  title: string
  description: string
  attachments: Array<{
    id: string
    file: File
    preview: string
    fileType: string
    fileName: string
  }>
}

interface AthleteFormProps {
  athleteId?: number
  initialData?: Partial<AthleteFormData>
  availableSports: Array<{ id: number; name: string }>
  onSave: (data: AthleteFormData, documents?: TempDocument[]) => Promise<void>
  onCancel: () => void
}

export function AthleteForm({
  athleteId,
  initialData,
  availableSports,
  onSave,
  onCancel,
}: AthleteFormProps) {
  const isEditing = !!athleteId
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, isUploading: isUploadingImage } = useImageUpload()
  const [tempDocuments, setTempDocuments] = useState<TempDocument[]>([])

  // React Hook Form com Zod
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AthleteFormData>({
    resolver: zodResolver(athleteFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      gender: initialData?.gender || null,
      birthDate: initialData?.birthDate || '',
      weight: initialData?.weight || null,
      height: initialData?.height || null,
      sportIds: initialData?.sportIds || [],
      notes: initialData?.notes || '',
      photo: initialData?.photo || null,
    },
  })

  const photoValue = watch('photo')
  const sportIdsValue = watch('sportIds')

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const base64 = await uploadImage(file)
    if (base64) {
      setValue('photo', base64)
    }
  }

  const handleSportToggle = (sportId: number) => {
    const current = sportIdsValue || []
    const updated = current.includes(sportId)
      ? current.filter((id) => id !== sportId)
      : [...current, sportId]
    setValue('sportIds', updated)
  }

  const onSubmit = async (data: AthleteFormData) => {
    try {
      await onSave(data, tempDocuments)
    } catch (error) {
      console.error('Erro no formulário:', error)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header fixo */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar>
          <IconButton edge="start" onClick={onCancel}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, ml: 2 }}>
            {isEditing ? 'Editar Atleta' : 'Novo Atleta'}
          </Typography>
          <Button
            type="submit"
            color="inherit"
            disabled={isSubmitting || isUploadingImage}
            sx={{ fontWeight: 600 }}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Conteúdo com scroll */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
        <Container maxWidth="sm" sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Foto de perfil */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={photoValue || undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                  }}
                >
                  {watch('name') ? (
                    watch('name')[0].toUpperCase()
                  ) : (
                    <Person sx={{ fontSize: 60 }} />
                  )}
                </Avatar>
                <IconButton
                  onClick={handlePhotoClick}
                  disabled={isUploadingImage}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  {isUploadingImage ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : !photoValue ? (
                    <CameraAlt sx={{ fontSize: 40 }} />
                  ) : (
                    <Edit />
                  )}
                </IconButton>
              </Box>
            </Box>

            {/* Nome */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome do Atleta"
                  placeholder="Ex: João Silva"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  InputProps={{
                    sx: { borderRadius: 2 },
                  }}
                />
              )}
            />

            {/* Gênero */}
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <FormControl component="fieldset" error={!!errors.gender}>
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                    Gênero
                  </FormLabel>
                  <RadioGroup
                    row
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  >
                    <FormControlLabel value="male" control={<Radio />} label="Masculino" />
                    <FormControlLabel value="female" control={<Radio />} label="Feminino" />
                    <FormControlLabel value="other" control={<Radio />} label="Outro" />
                  </RadioGroup>
                  {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
                </FormControl>
              )}
            />

            {/* Data de Nascimento */}
            <Controller
              name="birthDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  label="Data de Nascimento"
                  type="date"
                  fullWidth
                  error={!!errors.birthDate}
                  helperText={errors.birthDate?.message}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    sx: { borderRadius: 2 },
                  }}
                />
              )}
            />

            {/* Peso e Altura */}
            <Stack direction="row" spacing={2}>
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    label="Altura (cm)"
                    placeholder="180"
                    type="number"
                    fullWidth
                    error={!!errors.height}
                    helperText={errors.height?.message}
                    InputProps={{
                      sx: { borderRadius: 2 },
                    }}
                  />
                )}
              />
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    label="Peso (kg)"
                    placeholder="75"
                    type="number"
                    fullWidth
                    error={!!errors.weight}
                    helperText={errors.weight?.message}
                    InputProps={{
                      sx: { borderRadius: 2 },
                    }}
                  />
                )}
              />
            </Stack>

            {/* Esportes */}
            {/* Esportes */}
            <Controller
              name="sportIds"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Esportes *
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {availableSports.map((sport) => (
                      <Chip
                        key={sport.id}
                        label={sport.name}
                        onClick={() => handleSportToggle(sport.id)}
                        color={field.value.includes(sport.id) ? 'primary' : 'default'}
                        variant={field.value.includes(sport.id) ? 'filled' : 'outlined'}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                  {errors.sportIds && (
                    <FormHelperText error sx={{ mt: 1 }}>
                      {errors.sportIds.message}
                    </FormHelperText>
                  )}
                </Box>
              )}
            />

            {/* Observações */}
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  label="Observações"
                  placeholder="Particularidades, histórico médico, etc..."
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  InputProps={{
                    sx: { borderRadius: 2 },
                  }}
                />
              )}
            />

            {/* Documentos */}
            <AthleteDocumentsSection athleteId={athleteId} onChange={setTempDocuments} />

            {/* Botões de Ação */}
            <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={onCancel}
                disabled={isSubmitting}
                sx={{ borderRadius: 2 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isSubmitting || isUploadingImage}
                sx={{ borderRadius: 2 }}
              >
                {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
