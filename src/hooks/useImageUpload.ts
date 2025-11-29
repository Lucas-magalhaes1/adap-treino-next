import { uploadFile } from '@/actions/storage'
import imageCompression from 'browser-image-compression'
import { useState } from 'react'
import { toast } from 'sonner'

type BucketType = 'athlete-photos' | 'athlete-documents'

interface UseImageUploadOptions {
  bucket?: BucketType
  folder?: string
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

interface UseImageUploadReturn {
  /**
   * Faz upload de uma imagem e retorna o filePath (não URL)
   * Use getSignedUrl() para obter URL de visualização
   */
  uploadImage: (file: File) => Promise<string | null>
  isUploading: boolean
  progress: number
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const { bucket = 'athlete-photos', folder, maxSizeMB = 0.5, maxWidthOrHeight = 800 } = options

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true)
      setProgress(0)

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Arquivo deve ser uma imagem')
        return null
      }

      // Validar tamanho (10MB max antes da compressão)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Imagem muito grande (máximo 10MB)')
        return null
      }

      toast.loading('Comprimindo imagem...')
      setProgress(20)

      // Opções de compressão
      const compressionOptions = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        onProgress: (p: number) => {
          setProgress(20 + p * 0.3) // 20-50%
        },
      }

      // Comprimir imagem
      const compressedFile = await imageCompression(file, compressionOptions)

      toast.dismiss()
      toast.loading('Enviando para o servidor...')
      setProgress(60)

      // Criar FormData para enviar ao server action
      const formData = new FormData()
      formData.set('file', compressedFile)
      formData.set('bucket', bucket)
      if (folder) formData.set('folder', folder)

      // Upload via server action (bucket privado)
      const result = await uploadFile(formData)

      if (!result.success || !result.filePath) {
        toast.dismiss()
        toast.error(result.error || 'Erro ao fazer upload')
        return null
      }

      setProgress(100)
      toast.dismiss()
      toast.success('Imagem carregada!')

      // Retorna o filePath, não a URL
      return result.filePath
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.dismiss()
      toast.error('Erro ao carregar imagem')
      return null
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return {
    uploadImage,
    isUploading,
    progress,
  }
}
