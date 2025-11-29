import { createClient } from '@supabase/supabase-js'

// Cliente Supabase público (client-side) - para operações que não precisam de admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Bucket para fotos de atletas (público - fotos de perfil)
export const ATHLETE_PHOTOS_BUCKET = 'user-profile-images'
// Bucket para documentos de atletas (privado - documentos sensíveis)
export const ATHLETE_DOCUMENTS_BUCKET = 'documents-images'

/**
 * Verificar se uma URL é do Supabase Storage
 */
export function isStorageUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('/storage/')
}

/**
 * Verificar se uma string é Base64
 */
export function isBase64(str: string): boolean {
  return str.startsWith('data:image/')
}

/**
 * Extrair o path do arquivo de uma URL do Supabase Storage
 */
export function extractPathFromUrl(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split(`/${bucket}/`)
    if (pathParts.length < 2) return null
    return pathParts[1]
  } catch {
    return null
  }
}
