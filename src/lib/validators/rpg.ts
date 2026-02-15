import { z } from "zod"

export const createRpgSchema = z.object({
  title: z.string().trim().min(3, "Titulo deve ter pelo menos 3 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "Descricao deve ter pelo menos 10 caracteres."),
  visibility: z.enum(["private", "public"]),
  useClassRaceBonuses: z.boolean().optional(),
  useInventoryWeightLimit: z.boolean().optional(),
})

export type CreateRpgInput = z.infer<typeof createRpgSchema>
