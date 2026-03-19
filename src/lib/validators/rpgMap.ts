import { z } from "zod"

const optionalTrimmedText = z
  .string()
  .trim()
  .max(1200, "Texto muito grande.")
  .nullable()
  .optional()

export const upsertRpgMapSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe um nome com ao menos 2 caracteres.")
    .max(120, "Nome muito grande."),
  description: optionalTrimmedText,
  type: z
    .string()
    .trim()
    .max(60, "Tipo muito grande.")
    .nullable()
    .optional(),
  image: z
    .string()
    .trim()
    .url("Informe uma URL de imagem valida.")
    .nullable()
    .optional(),
})

export const upsertRpgMapSectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com ao menos 2 caracteres.")
    .max(120, "Nome muito grande."),
  description: optionalTrimmedText,
  type: z
    .string()
    .trim()
    .max(60, "Tipo muito grande.")
    .nullable()
    .optional(),
  parentSectionId: z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional(),
  customFields: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const reorderRpgMapSectionSchema = z.object({
  direction: z.enum(["up", "down"]),
})
