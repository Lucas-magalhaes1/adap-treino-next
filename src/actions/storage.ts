'use server'

import { ATHLETE_DOCUMENTS_BUCKET, ATHLETE_PHOTOS_BUCKET } from '@/lib/storage'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase Admin (server-side apenas) - usa service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ==========================================
// TIPOS
// ==========================================

export interface UploadResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface SignedUrlResult {
  success: boolean
  signedUrl?: string
  error?: string
}

type BucketType = 'athlete-photos' | 'athlete-documents'

// ==========================================
// HELPERS
// ==========================================

function getBucketName(bucket: BucketType): string {
  switch (bucket) {
    case 'athlete-photos':
      return ATHLETE_PHOTOS_BUCKET
    case 'athlete-documents':
      return ATHLETE_DOCUMENTS_BUCKET
    default:
      return ATHLETE_PHOTOS_BUCKET
  }
}

function generateFileName(originalName: string): string {
  const fileExt = originalName.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 9)
  return `${timestamp}-${randomStr}.${fileExt}`
}

// ==========================================
// UPLOAD - Server Side (Bucket Privado)
// ==========================================

/**
 * Upload de arquivo para Supabase Storage via Server Action
 * Recebe o arquivo como FormData e faz upload com service role key
 */
export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get('file') as File
    const bucketType = (formData.get('bucket') as BucketType) || 'athlete-documents'
    const folder = formData.get('folder') as string | null

    if (!file) {
      return { success: false, error: 'Nenhum arquivo fornecido' }
    }

    // Validar tamanho (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'Arquivo muito grande (máximo 10MB)' }
    }

    const bucketName = getBucketName(bucketType)
    const fileName = generateFileName(file.name)
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Converter File para ArrayBuffer para upload server-side
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload com service role key (bypassa RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Retorna apenas o path, não a URL pública (bucket é privado)
    return {
      success: true,
      filePath: filePath,
    }
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Upload de múltiplos arquivos
 */
export async function uploadMultipleFiles(
  formData: FormData
): Promise<{ success: boolean; results: UploadResult[]; error?: string }> {
  try {
    const files = formData.getAll('files') as File[]
    const bucketType = (formData.get('bucket') as BucketType) || 'athlete-documents'
    const folder = formData.get('folder') as string | null

    if (!files || files.length === 0) {
      return { success: false, results: [], error: 'Nenhum arquivo fornecido' }
    }

    const results: UploadResult[] = []

    for (const file of files) {
      const singleFormData = new FormData()
      singleFormData.set('file', file)
      singleFormData.set('bucket', bucketType)
      if (folder) singleFormData.set('folder', folder)

      const result = await uploadFile(singleFormData)
      results.push(result)
    }

    const allSuccess = results.every((r) => r.success)
    return { success: allSuccess, results }
  } catch (error) {
    console.error('Erro ao fazer upload múltiplo:', error)
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ==========================================
// SIGNED URLs - Para visualização temporária
// ==========================================

/**
 * Gerar URL assinada para visualização temporária de um arquivo
 * @param filePath - Path do arquivo no bucket (não a URL completa)
 * @param bucket - Tipo do bucket
 * @param expiresIn - Tempo de expiração em segundos (padrão: 60s)
 */
export async function getSignedUrl(
  filePath: string,
  bucket: BucketType = 'athlete-documents',
  expiresIn: number = 60
): Promise<SignedUrlResult> {
  try {
    const bucketName = getBucketName(bucket)

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Erro ao gerar signed URL:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    }
  } catch (error) {
    console.error('Erro ao gerar signed URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Gerar URLs assinadas para múltiplos arquivos
 */
export async function getSignedUrls(
  filePaths: string[],
  bucket: BucketType = 'athlete-documents',
  expiresIn: number = 60
): Promise<{ success: boolean; urls: Record<string, string>; error?: string }> {
  try {
    const bucketName = getBucketName(bucket)

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrls(filePaths, expiresIn)

    if (error) {
      console.error('Erro ao gerar signed URLs:', error)
      return { success: false, urls: {}, error: error.message }
    }

    // Mapear path -> signedUrl
    const urls: Record<string, string> = {}
    data.forEach((item) => {
      if (item.signedUrl && item.path) {
        urls[item.path] = item.signedUrl
      }
    })

    return { success: true, urls }
  } catch (error) {
    console.error('Erro ao gerar signed URLs:', error)
    return {
      success: false,
      urls: {},
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ==========================================
// DELETE - Server Side
// ==========================================

/**
 * Deletar arquivo do storage
 */
export async function deleteFile(
  filePath: string,
  bucket: BucketType = 'athlete-documents'
): Promise<{ success: boolean; error?: string }> {
  try {
    const bucketName = getBucketName(bucket)

    const { error } = await supabaseAdmin.storage.from(bucketName).remove([filePath])

    if (error) {
      console.error('Erro ao deletar arquivo:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Deletar múltiplos arquivos
 */
export async function deleteFiles(
  filePaths: string[],
  bucket: BucketType = 'athlete-documents'
): Promise<{ success: boolean; error?: string }> {
  try {
    const bucketName = getBucketName(bucket)

    const { error } = await supabaseAdmin.storage.from(bucketName).remove(filePaths)

    if (error) {
      console.error('Erro ao deletar arquivos:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar arquivos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
