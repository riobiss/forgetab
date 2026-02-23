import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres."),
  username: z
    .string()
    .trim()
    .min(3, "Username deve ter pelo menos 3 caracteres.")
    .max(24, "Username deve ter no maximo 24 caracteres.")
    .regex(
      /^[a-z0-9_]+$/,
      "Username deve conter apenas letras minusculas, numeros e underscore.",
    ),
  email: z.email("Email invalido."),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres."),
})

export const loginSchema = z.object({
  email: z.email("Email invalido."),
  password: z.string().min(1, "Senha obrigatoria."),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
