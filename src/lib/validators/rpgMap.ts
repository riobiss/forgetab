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

export const upsertRpgMapMarkerGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com ao menos 2 caracteres.")
    .max(120, "Nome muito grande."),
  color: z
    .string()
    .trim()
    .min(4, "Informe uma cor valida.")
    .max(32, "Cor muito grande."),
  markers: z.array(z.object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1, "Informe um nome para o marcador.").max(120, "Nome muito grande."),
    location: z.string().trim().max(160, "Localizacao muito grande.").nullable().optional(),
    shortDescription: z.string().trim().max(500, "Descricao muito grande.").nullable().optional(),
    image: z.string().trim().url("Informe uma URL de imagem valida.").max(2048, "URL de imagem muito grande.").nullable().optional(),
    color: z.string().trim().max(32, "Cor muito grande.").nullable().optional(),
    x: z.number().finite(),
    y: z.number().finite(),
    size: z.number().finite().min(0.5, "Tamanho muito pequeno.").max(2, "Tamanho muito grande.").nullable().optional(),
    pinStyle: z.enum(["default", "label"]).nullable().optional(),
  })),
})
