'use client'

import { addAttachment, createDocument, getAthleteDocuments } from '@/actions/documents'
import { getSignedUrls, uploadFile } from '@/actions/storage'
import {
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  CameraAlt as CameraIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
  Error as ErrorIcon,
  PhotoLibrary as GalleryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import imageCompression from 'browser-image-compression'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Tipos de documentos padrão disponíveis para criação
const DEFAULT_DOCUMENT_TYPES = [
  { id: 'exame_medico', label: 'Exame Médico', icon: '🏥' },
  { id: 'atestado_frequencia', label: 'Atestado de Frequência Escolar', icon: '📚' },
  { id: 'laudo_medico', label: 'Laudo Médico', icon: '📋' },
  { id: 'laudo_psicologico', label: 'Laudo Psicológico', icon: '🧠' },
  { id: 'outro', label: 'Outro Documento', icon: '📄' },
]

interface TempAttachment {
  id: string
  file: File
  preview: string // URL local para preview antes do upload
  fileType: string
  fileName: string
}

interface TempDocument {
  id: string
  title: string
  description: string
  issuedAt?: string
  expiresAt?: string
  attachments: TempAttachment[]
}

interface ExistingAttachment {
  id: number
  filePath: string // Path no storage, não URL
  fileType: string
  fileSize: number | null
  fileName: string | null
  createdAt: Date
  signedUrl?: string // URL assinada para visualização
}

interface ExistingDocument {
  id: number
  athleteId: number
  title: string
  description: string | null
  issuedAt: string | null
  expiresAt: string | null
  attachments: ExistingAttachment[]
  isExpired: boolean
  isExpiringSoon: boolean
}

interface AthleteDocumentsSectionProps {
  athleteId?: number // Se existir, carrega documentos do banco
  onChange?: (documents: TempDocument[]) => void // Para novos atletas
}

export function AthleteDocumentsSection({ athleteId, onChange }: AthleteDocumentsSectionProps) {
  // Estado para documentos temporários (novo atleta)
  const [tempDocuments, setTempDocuments] = useState<TempDocument[]>([])

  // Estado para documentos existentes (atleta já cadastrado)
  const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)

  // Cache de signed URLs
  const [signedUrlCache, setSignedUrlCache] = useState<Record<string, string>>({})

  // Estado da modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<TempDocument | ExistingDocument | null>(
    null
  )
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Função para buscar signed URLs para os attachments
  const fetchSignedUrls = useCallback(
    async (documents: ExistingDocument[]) => {
      const allFilePaths = documents.flatMap((doc) => doc.attachments.map((att) => att.filePath))

      if (allFilePaths.length === 0) return

      // Filtrar paths que já não estão no cache
      const missingPaths = allFilePaths.filter((path) => !signedUrlCache[path])

      if (missingPaths.length === 0) return

      const result = await getSignedUrls(missingPaths, 'athlete-documents', 300) // 5 min expiry

      if (result.success) {
        setSignedUrlCache((prev) => ({ ...prev, ...result.urls }))
      }
    },
    [signedUrlCache]
  )

  const loadExistingDocuments = async () => {
    if (!athleteId) return
    setLoadingExisting(true)
    const result = await getAthleteDocuments(athleteId)
    if (result.success) {
      const docs = result.data as ExistingDocument[]
      setExistingDocuments(docs)
      // Buscar signed URLs para os anexos
      fetchSignedUrls(docs)
    }
    setLoadingExisting(false)
  }

  // Carregar documentos existentes se athleteId estiver presente
  useEffect(() => {
    if (athleteId) {
      loadExistingDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId])

  // Notificar mudanças nos documentos temporários
  useEffect(() => {
    onChange?.(tempDocuments)
  }, [tempDocuments, onChange])

  const handleOpenNewDocument = (typeId?: string) => {
    const type = DEFAULT_DOCUMENT_TYPES.find((t) => t.id === typeId)
    setSelectedType(typeId || null)
    setEditingDocument({
      id: `temp-${Date.now()}`,
      title: type?.label || '',
      description: '',
      attachments: [],
    })
    setModalOpen(true)
  }

  const handleOpenExistingDocument = (doc: TempDocument | ExistingDocument) => {
    setEditingDocument(doc)
    setSelectedType(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingDocument(null)
    setSelectedType(null)
  }

  const handleSaveDocument = async (doc: TempDocument) => {
    // Se é um atleta existente, salvar no banco
    if (athleteId && !('id' in doc && typeof doc.id === 'string')) {
      // Atualizar documento existente - não implementado aqui
      // pois usa o componente AthleteDocuments original
    } else if (athleteId) {
      // Criar novo documento para atleta existente
      const createResult = await createDocument({
        athleteId,
        title: doc.title,
        description: doc.description || undefined,
        issuedAt: doc.issuedAt,
        expiresAt: doc.expiresAt,
      })

      if (createResult.success && createResult.data) {
        const documentId = createResult.data.id

        // Upload e salvar cada anexo
        for (const attachment of doc.attachments) {
          // Upload do arquivo para o storage
          const formData = new FormData()
          formData.set('file', attachment.file)
          formData.set('bucket', 'athlete-documents')
          formData.set('folder', `athlete-${athleteId}`)

          const uploadResult = await uploadFile(formData)

          if (uploadResult.success && uploadResult.filePath) {
            // Salvar referência no banco
            await addAttachment({
              documentId,
              filePath: uploadResult.filePath,
              fileType: attachment.fileType,
              fileSize: attachment.file.size,
              fileName: attachment.fileName,
            })
          }
        }

        toast.success('Documento salvo com sucesso!')
      }

      await loadExistingDocuments()
    } else {
      // Novo atleta - salvar no estado temporário
      setTempDocuments((prev) => {
        const existing = prev.find((d) => d.id === doc.id)
        if (existing) {
          return prev.map((d) => (d.id === doc.id ? doc : d))
        }
        return [...prev, doc]
      })
    }
    handleCloseModal()
  }

  const handleRemoveTempDocument = (docId: string) => {
    setTempDocuments((prev) => prev.filter((d) => d.id !== docId))
  }

  const getStatusChip = (doc: ExistingDocument) => {
    const hasAttachments = doc.attachments.length > 0

    if (!hasAttachments) {
      return (
        <Chip
          icon={<WarningIcon />}
          label="Pendente"
          size="small"
          color="warning"
          variant="outlined"
        />
      )
    }

    if (doc.isExpired) {
      return (
        <Chip icon={<ErrorIcon />} label="Vencido" size="small" color="error" variant="filled" />
      )
    }

    if (doc.isExpiringSoon) {
      return (
        <Chip
          icon={<WarningIcon />}
          label="Vencendo"
          size="small"
          color="warning"
          variant="filled"
        />
      )
    }

    return (
      <Chip icon={<CheckCircleIcon />} label="OK" size="small" color="success" variant="outlined" />
    )
  }

  const allDocuments: (TempDocument | ExistingDocument)[] = athleteId
    ? existingDocuments
    : tempDocuments
  const hasDocuments = allDocuments.length > 0

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
        Documentos
      </Typography>

      {loadingExisting ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : hasDocuments ? (
        // Lista horizontal de documentos
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            pb: 1,
            mb: 1,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.300',
              borderRadius: 3,
            },
          }}
        >
          {allDocuments.map((doc) => {
            const isTemp = 'id' in doc && typeof doc.id === 'string'
            const attachmentCount = doc.attachments.length
            const firstAttachment = doc.attachments[0]

            // Verificar se o primeiro anexo é uma imagem
            let hasImage = false
            if (firstAttachment) {
              if (isTemp) {
                hasImage =
                  (firstAttachment as TempAttachment).fileType?.startsWith('image/') ?? false
              } else {
                hasImage =
                  (firstAttachment as ExistingAttachment).fileType?.startsWith('image/') ?? false
              }
            }

            return (
              <Box
                key={isTemp ? doc.id : (doc as ExistingDocument).id}
                onClick={() => handleOpenExistingDocument(doc)}
                sx={{
                  minWidth: 100,
                  maxWidth: 100,
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    '& .delete-btn': {
                      opacity: 1,
                    },
                  },
                }}
              >
                {/* Thumbnail ou ícone */}
                <Box
                  sx={{
                    width: 100,
                    height: 80,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.5,
                  }}
                >
                  {hasImage ? (
                    <Box
                      component="img"
                      src={
                        isTemp
                          ? (firstAttachment as TempAttachment).preview
                          : signedUrlCache[(firstAttachment as ExistingAttachment).filePath] ||
                            '/placeholder-image.png'
                      }
                      alt={doc.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        bgcolor: attachmentCount > 0 ? 'primary.main' : 'grey.300',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <DocumentIcon />
                    </Avatar>
                  )}
                </Box>

                {/* Título */}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.title}
                </Typography>

                {/* Status para documentos existentes */}
                {!isTemp && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                    {getStatusChip(doc as ExistingDocument)}
                  </Box>
                )}

                {/* Botão de remover para documentos temporários */}
                {isTemp && (
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTempDocument(doc.id as string)
                    }}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        bgcolor: 'error.dark',
                      },
                      width: 24,
                      height: 24,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
            )
          })}

          {/* Botão de adicionar */}
          <Box
            onClick={() => handleOpenNewDocument()}
            sx={{
              minWidth: 100,
              maxWidth: 100,
              cursor: 'pointer',
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 80,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'grey.300',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                },
              }}
            >
              <AddIcon sx={{ color: 'grey.500', mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                Adicionar
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        // Estado vazio - card tracejado
        <Box
          onClick={() => handleOpenNewDocument()}
          sx={{
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
        >
          <AddIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Adicionar Documento
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Atestados, laudos, exames...
          </Typography>
        </Box>
      )}

      {/* Modal de Edição/Criação */}
      <DocumentEditorModal
        open={modalOpen}
        document={editingDocument as TempDocument | null}
        selectedType={selectedType}
        onClose={handleCloseModal}
        onSave={handleSaveDocument}
        isExisting={
          athleteId !== undefined &&
          editingDocument !== null &&
          !('id' in editingDocument && typeof editingDocument.id === 'string')
        }
      />
    </Box>
  )
}

// ==========================================
// Modal de Edição de Documento
// ==========================================

interface DocumentEditorModalProps {
  open: boolean
  document: TempDocument | null
  selectedType: string | null
  onClose: () => void
  onSave: (doc: TempDocument) => void
  isExisting?: boolean
}

function DocumentEditorModal({
  open,
  document,
  selectedType,
  onClose,
  onSave,
  isExisting,
}: DocumentEditorModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [issuedAt, setIssuedAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [attachments, setAttachments] = useState<TempAttachment[]>([])
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset quando abre a modal
  useEffect(() => {
    if (open && document) {
      setTitle(document.title)
      setDescription(document.description)
      setIssuedAt((document as TempDocument & { issuedAt?: string }).issuedAt || '')
      setExpiresAt((document as TempDocument & { expiresAt?: string }).expiresAt || '')
      setAttachments(document.attachments as TempAttachment[])
      setShowTypeSelector(!document.title && !selectedType)
    }
  }, [open, document, selectedType])

  const handleTypeSelect = (typeId: string) => {
    const type = DEFAULT_DOCUMENT_TYPES.find((t) => t.id === typeId)
    if (type) {
      setTitle(type.label)
    }
    setShowTypeSelector(false)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsProcessing(true)

    for (const file of Array.from(files)) {
      let preview: string
      let processedFile: File = file

      if (file.type.startsWith('image/')) {
        // Comprimir imagem antes de guardar
        try {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          })
          processedFile = compressedFile
          preview = URL.createObjectURL(compressedFile)
        } catch {
          preview = URL.createObjectURL(file)
        }
      } else {
        preview = '' // PDF ou outros
      }

      const newAttachment: TempAttachment = {
        id: `attach-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file: processedFile,
        preview,
        fileType: file.type,
        fileName: file.name,
      }

      setAttachments((prev) => [...prev, newAttachment])
    }

    setIsProcessing(false)

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (attachId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachId))
  }

  const handleSave = () => {
    if (!title.trim()) return

    onSave({
      id: document?.id || `temp-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      issuedAt: issuedAt || undefined,
      expiresAt: expiresAt || undefined,
      attachments,
    })
  }

  const isImage = (fileType: string) => fileType.startsWith('image/')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isExisting ? 'Visualizar Documento' : document?.id ? 'Editar Documento' : 'Novo Documento'}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {showTypeSelector ? (
          // Seletor de tipo de documento
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selecione o tipo de documento:
            </Typography>
            <Stack spacing={1}>
              {DEFAULT_DOCUMENT_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant="outlined"
                  fullWidth
                  onClick={() => handleTypeSelect(type.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography sx={{ mr: 1.5 }}>{type.icon}</Typography>
                  {type.label}
                </Button>
              ))}
            </Stack>
          </Box>
        ) : (
          // Formulário de edição
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Título */}
            <TextField
              label="Título do Documento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              placeholder="Ex: Atestado Médico 2024"
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            {/* Datas de Emissão e Validade */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Data de Emissão"
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: { borderRadius: 2 } }}
                helperText="Quando o documento foi emitido"
              />
              <TextField
                label="Data de Validade"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: { borderRadius: 2 } }}
                helperText="Quando o documento expira"
              />
            </Stack>

            {/* Área de Upload */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Fotos / Arquivos
              </Typography>

              {/* Grid de anexos */}
              {attachments.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  {attachments.map((attachment) => (
                    <Box
                      key={attachment.id}
                      sx={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {isImage(attachment.fileType) ? (
                        <Box
                          component="img"
                          src={attachment.preview}
                          alt={attachment.fileName}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                          }}
                        >
                          <AttachFileIcon sx={{ fontSize: 32, color: 'grey.500' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {attachment.fileType.split('/')[1]?.toUpperCase() || 'Arquivo'}
                          </Typography>
                        </Box>
                      )}

                      {/* Botão de remover */}
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'error.main',
                          },
                          width: 24,
                          height: 24,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Botões de adicionar */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={isProcessing ? <CircularProgress size={16} /> : <CameraIcon />}
                  onClick={handleFileSelect}
                  disabled={isProcessing}
                  sx={{ flex: 1, borderRadius: 2 }}
                >
                  Câmera
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GalleryIcon />}
                  onClick={handleFileSelect}
                  disabled={isProcessing}
                  sx={{ flex: 1, borderRadius: 2 }}
                >
                  Galeria
                </Button>
              </Stack>

              {attachments.length === 0 && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  Adicione fotos ou arquivos do documento
                </Alert>
              )}
            </Box>

            {/* Descrição */}
            <TextField
              label="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Observações sobre o documento..."
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Stack>
        )}
      </DialogContent>

      {!showTypeSelector && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!title.trim() || isProcessing}
            sx={{ borderRadius: 2 }}
          >
            Salvar
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
