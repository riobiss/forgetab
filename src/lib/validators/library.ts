import { z } from "zod"

export const createLibrarySectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe um titulo com ao menos 2 caracteres.")
    .max(120, "Titulo muito grande."),
  description: z
    .string()
    .trim()
    .max(400, "Descricao muito grande.")
    .nullable()
    .optional(),
  visibility: z.enum(["private", "public"]).default("public"),
})

export const createLibraryBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe um titulo com ao menos 2 caracteres.")
    .max(160, "Titulo muito grande."),
  description: z
    .string()
    .trim()
    .max(280, "Descricao muito grande.")
    .nullable()
    .optional(),
  content: z
    .object({
      type: z.string(),
      content: z.array(z.unknown()).optional(),
    })
    .passthrough(),
  visibility: z.enum(["private", "public", "unlisted"]).default("private"),
  allowedCharacterIds: z.array(z.string().trim().min(1)).default([]),
  allowedClassKeys: z.array(z.string().trim().min(1)).default([]),
  allowedRaceKeys: z.array(z.string().trim().min(1)).default([]),
})
