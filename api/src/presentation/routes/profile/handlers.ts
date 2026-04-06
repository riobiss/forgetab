import type { FastifyReply, FastifyRequest } from "fastify"
import { loadProfilePageUseCase } from "@/application/profile/use-cases/loadProfilePage"
import { prismaProfileRepository } from "@/infrastructure/profile/repositories/prismaProfileRepository"
import { getAuthPayloadFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"

export async function getProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await getAuthPayloadFromFastifyRequest(request)

  if (!auth) {
    reply.code(401)
    return reply.send({ message: "Usuario nao autenticado." })
  }

  const result = await loadProfilePageUseCase({
    repository: prismaProfileRepository,
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
