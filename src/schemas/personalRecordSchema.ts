import { z } from 'zod'

export const personalRecordFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  value: z.number().positive('Valor deve ser maior que zero'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  dateAchieved: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
})

export type PersonalRecordFormSchema = z.infer<typeof personalRecordFormSchema>
