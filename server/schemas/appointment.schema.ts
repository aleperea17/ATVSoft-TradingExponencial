import { z } from 'zod'

export const videoCompletedSchema = z.strictObject({
  publicReference: z
    .string()
    .trim()
    .min(8)
    .max(80)
    .regex(/^[A-Za-z0-9_-]+$/, 'Referencia inválida')
    .optional(),
})

export type VideoCompletedInput = z.infer<typeof videoCompletedSchema>
