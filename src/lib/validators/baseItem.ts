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

const namedDescriptionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome e obrigatorio.")
    .max(120, "Nome deve ter no maximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "Descricao e obrigatoria.")
    .max(500, "Descricao deve ter no maximo 500 caracteres."),
})

export const createBaseItemSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  type: z.enum(baseItemTypeValues, { message: "Tipo de item invalido." }),
  rarity: z.enum(baseItemRarityValues, { message: "Raridade invalida." }),
  damage: z
    .string()
    .trim()
    .max(120, "Dano deve ter no maximo 120 caracteres.")
    .nullable()
    .optional(),
  ability: z
    .string()
    .trim()
    .max(120, "Habilidade deve ter no maximo 120 caracteres.")
    .nullable()
    .optional(),
  abilityName: z
    .string()
    .trim()
    .max(120, "Nome da habilidade deve ter no maximo 120 caracteres.")
    .nullable()
    .optional(),
  effect: z
    .string()
    .trim()
    .max(500, "Efeito deve ter no maximo 500 caracteres.")
    .nullable()
    .optional(),
  effectName: z
    .string()
    .trim()
    .max(120, "Nome do efeito deve ter no maximo 120 caracteres.")
    .nullable()
    .optional(),
  abilities: z.array(namedDescriptionSchema).max(20).nullable().optional(),
  effects: z.array(namedDescriptionSchema).max(20).nullable().optional(),
  weight: z.number().min(0, "Peso deve ser maior ou igual a 0.").nullable().optional(),
  durability: z
    .number()
    .int()
    .min(0, "Durabilidade deve ser maior ou igual a 0.")
    .nullable()
    .optional(),
})

export type CreateBaseItemInput = z.infer<typeof createBaseItemSchema>
