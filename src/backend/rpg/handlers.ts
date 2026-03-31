import { createRpg } from "@/application/rpgManagement/use-cases/createRpg"
import { prismaRpgRepository } from "@/infrastructure/rpgManagement/repositories/prismaRpgRepository"
import { getAuthPayloadFromRequest } from "@/backend/auth/requestAuth"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"

export async function createRpgHandler(request: Request) {
  const authPayload = await getAuthPayloadFromRequest(request)
  if (!authPayload) {
    return jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = await createRpg(
      { repository: prismaRpgRepository },
      { userId: authPayload.userId, body },
    )

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar RPG.")
  }
}
