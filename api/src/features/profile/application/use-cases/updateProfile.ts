import type { ProfileWriter } from "@/features/profile/application//ports/ProfileWriter"

export type UpdateProfileInput = {
  userId: string
  name?: string
  username?: string
}

export async function updateProfileUseCase(repository: ProfileWriter, input: UpdateProfileInput) {
  const payload: { name?: string; username?: string } = {}

  if (typeof input.name === "string") {
    payload.name = input.name.trim()
  }

  if (typeof input.username === "string") {
    payload.username = input.username.trim().replace(/^@+/, "")
  }

  if (payload.name !== undefined && payload.name.length < 2) {
    return { status: "invalid" as const, message: "Nome deve ter pelo menos 2 caracteres." }
  }

  if (payload.username !== undefined && !/^[a-zA-Z0-9_]{3,30}$/.test(payload.username)) {
    return {
      status: "invalid" as const,
      message: "Username deve ter 3 a 30 caracteres e usar apenas letras, numeros e underline.",
    }
  }

  const updatedUser = await repository.updateByUserId(input.userId, payload)

  return {
    status: "ok" as const,
    data: updatedUser,
  }
}
