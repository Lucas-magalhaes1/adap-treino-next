import { z } from 'zod'

// Schema de validação para criação/edição de atleta
export const athleteFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),

  gender: z.enum(['male', 'female', 'other']).nullable().optional(),

  birthDate: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const birthDate = new Date(date)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        return age >= 5 && age <= 120
      },
      { message: 'Data de nascimento inválida (idade entre 5 e 120 anos)' }
    ),

  weight: z
    .number()
    .positive('Peso deve ser positivo')
    .max(500, 'Peso muito alto')
    .nullable()
    .optional(),

  height: z
    .number()
    .positive('Altura deve ser positiva')
    .max(300, 'Altura muito alta')
    .nullable()
    .optional(),

  sportIds: z.array(z.number()).min(1, 'Selecione pelo menos um esporte'),

  notes: z.string().max(1000, 'Observações muito longas').optional(),

  photo: z.string().nullable().optional(),
})

export type AthleteFormData = z.infer<typeof athleteFormSchema>

// Schema para validação no servidor (aceita FormData)
export const athleteServerSchema = athleteFormSchema.extend({
  id: z.number().optional(), // Para edição
})

export type AthleteServerData = z.infer<typeof athleteServerSchema>
