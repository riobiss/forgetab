import { z } from "zod"

export const baseItemTypeValues = [
  "weapon",
  "armor",
  "consumable",
  "accessory",
  "material",
  "quest",
] as const

export const baseItemRarityValues = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const

export const createBaseItemSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  type: z.enum(baseItemTypeValues, { message: "Tipo de item invalido." }),
  rarity: z.enum(baseItemRarityValues, { message: "Raridade invalida." }),
})

export type CreateBaseItemInput = z.infer<typeof createBaseItemSchema>
