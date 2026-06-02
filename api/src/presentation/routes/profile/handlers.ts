import type { FastifyReply, FastifyRequest } from "fastify"
import { loadProfilePageUseCase } from "@/application/profile/use-cases/loadProfilePage"
import { updateProfileUseCase } from "@/application/profile/use-cases/updateProfile"
import { updateRpgProfileUseCase } from "@/application/profile/use-cases/updateRpgProfile"
import { getAuthPayloadFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { profileRouteDeps } from "@api/presentation/routes/profile/dependencies"

export async function getProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await getAuthPayloadFromFastifyRequest(request)

  if (!auth) {
    reply.code(401)
    return reply.send({ message: "Usuario nao autenticado." })
  }

  const result = await loadProfilePageUseCase({
    repository: profileRouteDeps.reader,
    sessionService: {
      async getAuthenticatedUser() {
        return {
          userId: auth.userId,
          email: auth.email,
        }
      },
    },
  })

  if (result.status === "unauthenticated") {
    reply.code(401)
    return reply.send({ message: "Usuario nao autenticado." })
  }

  reply.code(200)
  return reply.send(result.data)
}

export async function updateProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await getAuthPayloadFromFastifyRequest(request)

  if (!auth) {
    return writeJson(reply, 401, { message: "Usuario nao autenticado." })
  }

  try {
    const body = (parseJsonBody(request.body) ?? {}) as {
      name?: unknown
      username?: unknown
    }

    const result = await updateProfileUseCase(profileRouteDeps.writer, {
      userId: auth.userId,
      name: typeof body.name === "string" ? body.name : undefined,
      username: typeof body.username === "string" ? body.username : undefined,
    })

    if (result.status === "invalid") {
      return writeJson(reply, 400, { message: result.message })
    }

    return writeJson(reply, 200, result.data)
  } catch (error) {
    return writeError(reply, error, "Erro ao atualizar perfil.")
  }
}

export async function updateRpgProfileHandler(
  request: FastifyRequest<{ Params: { rpgId: string } }>,
  reply: FastifyReply,
) {
  const auth = await getAuthPayloadFromFastifyRequest(request)

  if (!auth) {
    return writeJson(reply, 401, { message: "Usuario nao autenticado." })
  }

  try {
    const body = (parseJsonBody(request.body) ?? {}) as {
      displayName?: unknown
    }

    const result = await updateRpgProfileUseCase(
      {
        accessService: profileRouteDeps.rpgProfileAccessService,
        writer: profileRouteDeps.rpgProfileWriter,
      },
      {
        userId: auth.userId,
        rpgId: request.params.rpgId,
        displayName: typeof body.displayName === "string" ? body.displayName : null,
      },
    )

    if (result.status === "invalid") {
      return writeJson(reply, 400, { message: result.message })
    }

    return writeJson(reply, 200, result.data)
  } catch (error) {
    return writeError(reply, error, "Erro ao atualizar perfil do RPG.")
  }
}
