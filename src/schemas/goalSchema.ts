import { z } from 'zod'

export const goalFormSchema = z.object({
  title: z.string().min(3, 'Informe um título com pelo menos 3 caracteres'),
  startValue: z.coerce.number().nonnegative('Informe a marca inicial'),
  targetValue: z.coerce.number().positive('Informe a meta a ser alcançada'),
  unit: z.string().min(1, 'Selecione uma unidade'),
  targetDate: z.string().min(1, 'Informe a data alvo'),
  notes: z.string().max(1000, 'Use até 1000 caracteres').optional().or(z.literal('')),
})
//   .refine((data) => data.targetValue > data.startValue, {
//     path: ['targetValue'],
//     message: 'A meta deve ser maior do que o valor atual',
//   })

export type GoalFormSchema = z.infer<typeof goalFormSchema>

export const goalServerSchema = goalFormSchema.safeExtend({
  athleteId: z.number().int().positive(),
})

export const goalProgressSchema = z.object({
  currentValue: z.coerce.number().nonnegative('Informe o valor atualizado'),
  notes: z.string().max(1000, 'Use até 1000 caracteres').optional().or(z.literal('')),
})

export type GoalProgressSchema = z.infer<typeof goalProgressSchema>
