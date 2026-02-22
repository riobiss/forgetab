import { z } from "zod"

export const createRpgSchema = z.object({
  title: z.string().trim().min(3, "Titulo deve ter pelo menos 3 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "Descricao deve ter pelo menos 10 caracteres."),
  image: z
    .union([z.string().trim().url("Imagem do RPG deve ser uma URL valida."), z.null()])
    .optional(),
  visibility: z.enum(["private", "public"]),
  costsEnabled: z.boolean().optional(),
  costResourceName: z
    .string()
    .trim()
    .min(1, "Nome do recurso de custo e obrigatorio.")
    .max(60, "Nome do recurso de custo muito longo.")
    .optional(),
  useMundiMap: z.boolean().optional(),
  useRaceBonuses: z.boolean().optional(),
  useClassBonuses: z.boolean().optional(),
  useClassRaceBonuses: z.boolean().optional(),
  useInventoryWeightLimit: z.boolean().optional(),
})

export type CreateRpgInput = z.infer<typeof createRpgSchema>
