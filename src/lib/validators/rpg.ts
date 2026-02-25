import { z } from "zod"

const progressionTierSchema = z.object({
  label: z.string().trim().min(1, "Nome da progressao e obrigatorio."),
  required: z.number().int().min(0, "Required deve ser zero ou maior."),
})

export const createRpgSchema = z.object({
  title: z.string().trim().min(3, "Titulo deve ter pelo menos 3 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "Descricao deve ter pelo menos 10 caracteres.")
    .max(400, "Descricao deve ter no maximo 400 caracteres."),
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
  usersCanManageOwnXp: z.boolean().optional(),
  allowSkillPointDistribution: z.boolean().optional(),
  progressionMode: z.enum(["xp_level", "rank", "custom"]).optional(),
  progressionTiers: z.array(progressionTierSchema).min(1).optional(),
})

export type CreateRpgInput = z.infer<typeof createRpgSchema>
