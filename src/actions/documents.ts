'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ==========================================
// TIPOS
// ==========================================

export interface CreateDocumentInput {
  athleteId: number
  title: string
  description?: string
  issuedAt?: string
  expiresAt?: string
}

export interface UpdateDocumentInput {
  title?: string
  description?: string | null
  issuedAt?: string | null
  expiresAt?: string | null
}

export interface AddAttachmentInput {
  documentId: number
  filePath: string
  fileType: string
  fileSize?: number
  fileName?: string
}

// ==========================================
// DOCUMENTOS - CRUD
// ==========================================

/**
 * Buscar todos os documentos de um atleta
 */
export async function getAthleteDocuments(athleteId: number) {
  try {
    const documents = await prisma.athleteDocument.findMany({
      where: { athleteId },
      include: {
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { title: 'asc' },
    })

    return {
      success: true,
      data: documents.map((doc) => ({
        ...doc,
        issuedAt: doc.issuedAt?.toISOString().split('T')[0] || null,
        expiresAt: doc.expiresAt?.toISOString().split('T')[0] || null,
        isExpired: doc.expiresAt ? new Date(doc.expiresAt) < new Date() : false,
        isExpiringSoon: doc.expiresAt
          ? new Date(doc.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
            new Date(doc.expiresAt) >= new Date()
          : false,
      })),
    }
  } catch (error) {
    console.error('Erro ao buscar documentos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}

/**
 * Buscar um documento específico
 */
export async function getDocument(documentId: number) {
  try {
    const document = await prisma.athleteDocument.findUnique({
      where: { id: documentId },
      include: {
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        athlete: {
          select: { id: true, name: true },
        },
      },
    })

    if (!document) {
      return {
        success: false,
        error: 'Documento não encontrado',
        data: null,
      }
    }

    return {
      success: true,
      data: {
        ...document,
        issuedAt: document.issuedAt?.toISOString().split('T')[0] || null,
        expiresAt: document.expiresAt?.toISOString().split('T')[0] || null,
        isExpired: document.expiresAt ? new Date(document.expiresAt) < new Date() : false,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar documento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null,
    }
  }
}

/**
 * Criar novo documento para um atleta
 */
export async function createDocument(data: CreateDocumentInput) {
  try {
    const document = await prisma.athleteDocument.create({
      data: {
        athleteId: data.athleteId,
        title: data.title,
        description: data.description || null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    revalidatePath(`/dashboard/athletes/${data.athleteId}`)

    return {
      success: true,
      data: document,
    }
  } catch (error) {
    console.error('Erro ao criar documento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Atualizar documento
 */
export async function updateDocument(documentId: number, data: UpdateDocumentInput) {
  try {
    const document = await prisma.athleteDocument.update({
      where: { id: documentId },
      data: {
        title: data.title,
        description: data.description,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        athlete: { select: { id: true } },
      },
    })

    revalidatePath(`/dashboard/athletes/${document.athlete.id}`)

    return {
      success: true,
      data: document,
    }
  } catch (error) {
    console.error('Erro ao atualizar documento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Deletar documento
 */
export async function deleteDocument(documentId: number) {
  try {
    const document = await prisma.athleteDocument.delete({
      where: { id: documentId },
      include: {
        athlete: { select: { id: true } },
      },
    })

    revalidatePath(`/dashboard/athletes/${document.athlete.id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erro ao deletar documento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ==========================================
// ANEXOS - CRUD
// ==========================================

/**
 * Adicionar anexo a um documento
 */
export async function addAttachment(data: AddAttachmentInput) {
  try {
    const attachment = await prisma.athleteDocumentAttachment.create({
      data: {
        documentId: data.documentId,
        filePath: data.filePath,
        fileType: data.fileType,
        fileSize: data.fileSize || null,
        fileName: data.fileName || null,
      },
      include: {
        document: {
          include: {
            athlete: { select: { id: true } },
          },
        },
      },
    })

    revalidatePath(`/dashboard/athletes/${attachment.document.athlete.id}`)

    return {
      success: true,
      data: attachment,
    }
  } catch (error) {
    console.error('Erro ao adicionar anexo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Remover anexo
 */
export async function removeAttachment(attachmentId: number) {
  try {
    const attachment = await prisma.athleteDocumentAttachment.delete({
      where: { id: attachmentId },
      include: {
        document: {
          include: {
            athlete: { select: { id: true } },
          },
        },
      },
    })

    revalidatePath(`/dashboard/athletes/${attachment.document.athlete.id}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erro ao remover anexo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ==========================================
// QUERIES ÚTEIS
// ==========================================

/**
 * Buscar documentos vencidos ou prestes a vencer
 */
export async function getExpiringDocuments(daysAhead: number = 30) {
  try {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const documents = await prisma.athleteDocument.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
        },
      },
      include: {
        athlete: {
          select: { id: true, name: true },
        },
        attachments: true,
      },
      orderBy: { expiresAt: 'asc' },
    })

    return {
      success: true,
      data: documents.map((doc) => ({
        ...doc,
        issuedAt: doc.issuedAt?.toISOString().split('T')[0] || null,
        expiresAt: doc.expiresAt?.toISOString().split('T')[0] || null,
        isExpired: doc.expiresAt ? new Date(doc.expiresAt) < new Date() : false,
        daysUntilExpiry: doc.expiresAt
          ? Math.ceil((new Date(doc.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      })),
    }
  } catch (error) {
    console.error('Erro ao buscar documentos expirando:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}

/**
 * Buscar atletas com documentos pendentes (sem anexos)
 */
export async function getAthletesWithPendingDocuments() {
  try {
    const athletes = await prisma.athlete.findMany({
      where: {
        documents: {
          some: {
            attachments: {
              none: {},
            },
          },
        },
      },
      include: {
        documents: {
          where: {
            attachments: {
              none: {},
            },
          },
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: athletes.map((athlete) => ({
        id: athlete.id,
        name: athlete.name,
        pendingDocuments: athlete.documents,
        pendingCount: athlete.documents.length,
      })),
    }
  } catch (error) {
    console.error('Erro ao buscar atletas com documentos pendentes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}
