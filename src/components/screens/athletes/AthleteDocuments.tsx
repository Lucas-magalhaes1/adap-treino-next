'use client'

import {
  addAttachment,
  getAthleteDocuments,
  removeAttachment,
  updateDocument,
} from '@/actions/documents'
import { deleteFile, getSignedUrls, uploadFile } from '@/actions/storage'
import {
  AttachFile as AttachFileIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import imageCompression from 'browser-image-compression'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface DocumentAttachment {
  id: number
  filePath: string // Path no storage, não URL
  fileType: string
  fileSize: number | null
  fileName: string | null
  createdAt: Date
}

interface AthleteDoc {
  id: number
  athleteId: number
  title: string
  description: string | null
  issuedAt: string | null
  expiresAt: string | null
  createdAt: Date
  updatedAt: Date
  attachments: DocumentAttachment[]
  isExpired: boolean
  isExpiringSoon: boolean
}

interface AthleteDocumentsProps {
  athleteId: number
  athleteName: string
  open: boolean
  onClose: () => void
}

export function AthleteDocuments({ athleteId, athleteName, open, onClose }: AthleteDocumentsProps) {
  const [documents, setDocuments] = useState<AthleteDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDoc, setExpandedDoc] = useState<number | false>(false)
  const [editingDoc, setEditingDoc] = useState<AthleteDoc | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Cache de signed URLs para os anexos
  const [signedUrlCache, setSignedUrlCache] = useState<Record<string, string>>({})

  // Buscar signed URLs para os anexos
  const fetchSignedUrls = useCallback(
    async (docs: AthleteDoc[]) => {
      const allFilePaths = docs.flatMap((doc) => doc.attachments.map((att) => att.filePath))

      if (allFilePaths.length === 0) return

      // Filtrar paths que ainda não estão no cache
      const missingPaths = allFilePaths.filter((path) => !signedUrlCache[path])

      if (missingPaths.length === 0) return

      const result = await getSignedUrls(missingPaths, 'athlete-documents', 300) // 5 min

      if (result.success) {
        setSignedUrlCache((prev) => ({ ...prev, ...result.urls }))
      }
    },
    [signedUrlCache]
  )

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    const result = await getAthleteDocuments(athleteId)
    if (result.success) {
      const docs = result.data as AthleteDoc[]
      setDocuments(docs)
      // Buscar signed URLs
      fetchSignedUrls(docs)
    }
    setLoading(false)
  }, [athleteId, fetchSignedUrls])

  useEffect(() => {
    if (open) {
      loadDocuments()
    }
  }, [loadDocuments, open])

  const handleAccordionChange =
    (docId: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedDoc(isExpanded ? docId : false)
    }

  const getStatusChip = (doc: AthleteDoc) => {
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

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          Documentos - {athleteName}
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Documentos - {athleteName}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {documents.length === 0 ? (
          <Alert severity="info">Nenhum documento cadastrado para este atleta.</Alert>
        ) : (
          <Stack spacing={1}>
            {documents.map((doc) => (
              <Accordion
                key={doc.id}
                expanded={expandedDoc === doc.id}
                onChange={handleAccordionChange(doc.id)}
                sx={{
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ width: '100%', pr: 2 }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: doc.attachments.length > 0 ? 'primary.main' : 'grey.300',
                        width: 36,
                        height: 36,
                      }}
                    >
                      <DocumentIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="600" noWrap>
                        {doc.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.attachments.length} anexo(s)
                        {doc.expiresAt && ` • Validade: ${doc.expiresAt}`}
                      </Typography>
                    </Box>
                    {getStatusChip(doc)}
                  </Stack>
                </AccordionSummary>

                <AccordionDetails>
                  <DocumentDetails
                    document={doc}
                    onUpdate={loadDocuments}
                    onEdit={() => setEditingDoc(doc)}
                    onPreviewImage={setPreviewImage}
                    signedUrlCache={signedUrlCache}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}

        {/* Dialog de edição */}
        {editingDoc && (
          <EditDocumentDialog
            document={editingDoc}
            open={!!editingDoc}
            onClose={() => setEditingDoc(null)}
            onSave={loadDocuments}
          />
        )}

        {/* Dialog de preview de imagem */}
        <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md" fullWidth>
          <DialogTitle
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            Visualizar Anexo
            <IconButton onClick={() => setPreviewImage(null)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {previewImage && (
              <Box
                component="img"
                src={previewImage}
                alt="Preview"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// Componente de Detalhes do Documento
// ==========================================

interface DocumentDetailsProps {
  document: AthleteDoc
  onUpdate: () => void
  onEdit: () => void
  onPreviewImage: (url: string) => void
  signedUrlCache: Record<string, string>
}

function DocumentDetails({
  document,
  onUpdate,
  onEdit,
  onPreviewImage,
  signedUrlCache,
}: DocumentDetailsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      let fileToUpload = file

      // Para imagens, comprimir antes de enviar
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }
        fileToUpload = await imageCompression(file, options)
      }

      // Criar FormData para upload
      const formData = new FormData()
      formData.set('file', fileToUpload, file.name)
      formData.set('bucket', 'athlete-documents')

      // Upload via server action
      const uploadResult = await uploadFile(formData)

      if (!uploadResult.success || !uploadResult.filePath) {
        toast.error('Erro ao fazer upload do arquivo')
        return
      }

      // Salvar no banco com o path do storage
      await addAttachment({
        documentId: document.id,
        filePath: uploadResult.filePath,
        fileType: file.type,
        fileSize: fileToUpload.size,
        fileName: file.name,
      })

      toast.success('Anexo adicionado com sucesso')
      onUpdate()
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao processar arquivo')
    } finally {
      setIsUploading(false)
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = async (attachment: DocumentAttachment) => {
    setIsDeleting(attachment.id)

    try {
      // Deletar do storage
      await deleteFile(attachment.filePath, 'athlete-documents')
      // Deletar do banco
      await removeAttachment(attachment.id)
      toast.success('Anexo removido')
      onUpdate()
    } catch (error) {
      console.error('Erro ao remover anexo:', error)
      toast.error('Erro ao remover anexo')
    } finally {
      setIsDeleting(null)
    }
  }

  const isImage = (fileType: string) => fileType.startsWith('image/')

  // Obter URL para exibição do anexo
  const getAttachmentUrl = (attachment: DocumentAttachment): string | null => {
    return signedUrlCache[attachment.filePath] || null
  }

  return (
    <Box>
      {/* Info do documento */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
          Editar Info
        </Button>
        {document.issuedAt && (
          <Chip
            icon={<CalendarIcon />}
            label={`Emitido: ${document.issuedAt}`}
            size="small"
            variant="outlined"
          />
        )}
        {document.expiresAt && (
          <Chip
            icon={<CalendarIcon />}
            label={`Validade: ${document.expiresAt}`}
            size="small"
            variant="outlined"
            color={document.isExpired ? 'error' : document.isExpiringSoon ? 'warning' : 'default'}
          />
        )}
      </Stack>

      {document.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {document.description}
        </Typography>
      )}

      {/* Anexos */}
      <Typography variant="caption" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
        Anexos
      </Typography>

      {document.attachments.length > 0 ? (
        <ImageList cols={3} gap={8} sx={{ mb: 2 }}>
          {document.attachments.map((attachment) => {
            const url = getAttachmentUrl(attachment)

            return (
              <ImageListItem
                key={attachment.id}
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: isImage(attachment.fileType) && url ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (isImage(attachment.fileType) && url) {
                    onPreviewImage(url)
                  }
                }}
              >
                {isImage(attachment.fileType) ? (
                  url ? (
                    <Box
                      component="img"
                      src={url}
                      alt={attachment.fileName || 'Anexo'}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  )
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                    }}
                  >
                    <AttachFileIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      {attachment.fileType.split('/')[1]?.toUpperCase() || 'Arquivo'}
                    </Typography>
                  </Box>
                )}
                <ImageListItemBar
                  title={attachment.fileName || 'Sem nome'}
                  actionIcon={
                    <IconButton
                      size="small"
                      sx={{ color: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveAttachment(attachment)
                      }}
                      disabled={isDeleting === attachment.id}
                    >
                      {isDeleting === attachment.id ? (
                        <CircularProgress size={16} sx={{ color: 'white' }} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  }
                />
              </ImageListItem>
            )
          })}
        </ImageList>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Nenhum anexo. Adicione fotos ou arquivos do documento.
        </Alert>
      )}

      {/* Botão de upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Button
        variant="outlined"
        startIcon={isUploading ? <CircularProgress size={16} /> : <UploadIcon />}
        onClick={handleFileSelect}
        disabled={isUploading}
        fullWidth
        sx={{ borderRadius: 2 }}
      >
        {isUploading ? 'Enviando...' : 'Adicionar Anexo'}
      </Button>
    </Box>
  )
}

// ==========================================
// Dialog de Edição do Documento
// ==========================================

interface EditDocumentDialogProps {
  document: AthleteDoc
  open: boolean
  onClose: () => void
  onSave: () => void
}

function EditDocumentDialog({ document, open, onClose, onSave }: EditDocumentDialogProps) {
  const [title, setTitle] = useState(document.title)
  const [description, setDescription] = useState(document.description || '')
  const [issuedAt, setIssuedAt] = useState(document.issuedAt || '')
  const [expiresAt, setExpiresAt] = useState(document.expiresAt || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await updateDocument(document.id, {
      title,
      description: description || null,
      issuedAt: issuedAt || null,
      expiresAt: expiresAt || null,
    })
    setIsSaving(false)
    onSave()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Documento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Data de Emissão"
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Data de Validade"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving || !title}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
