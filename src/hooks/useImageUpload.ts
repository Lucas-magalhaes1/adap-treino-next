import imageCompression from 'browser-image-compression'
import { useState } from 'react'
import { toast } from 'sonner'

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<string | null>
  isUploading: boolean
  progress: number
}

export function useImageUpload(): UseImageUploadReturn {
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

      // Validar tamanho (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Imagem muito grande (máximo 10MB)')
        return null
      }

      toast.loading('Comprimindo imagem...')
      setProgress(20)

      // Opções de compressão
      const options = {
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 800, // Max 800px
        useWebWorker: true,
        onProgress: (p: number) => {
          setProgress(20 + p * 0.3) // 20-50%
        },
      }

      // Comprimir imagem
      const compressedFile = await imageCompression(file, options)

      toast.dismiss()
      toast.loading('Convertendo para base64...')
      setProgress(60)

      // Converter para base64
      const base64 = await fileToBase64(compressedFile)

      setProgress(100)
      toast.dismiss()
      toast.success('Imagem carregada!')

      return base64
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
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

// Converter File para base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Erro ao converter imagem'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
