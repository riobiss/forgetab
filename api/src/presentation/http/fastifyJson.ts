import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/shared/errors/AppError"
import { getUserIdFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"

export function parseJsonBody(body: unknown) {
  if (body == null) {
    return null
  }

  if (Buffer.isBuffer(body)) {
    const raw = body.toString("utf8").trim()
    return raw ? JSON.parse(raw) : null
  }

  if (typeof body === "string") {
    const raw = body.trim()
    return raw ? JSON.parse(raw) : null
  }

  return body
}

export function writeJson(reply: FastifyReply, status: number, body: unknown) {
  reply.code(status)
  reply.header("Content-Type", "application/json; charset=utf-8")
  return reply.send(body)
}

export function writeError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return writeJson(reply, error.status, { message: error.message })
  }

  return writeJson(reply, 500, { message: fallbackMessage })
}

export async function requireUserId(request: FastifyRequest, reply: FastifyReply) {
  const userId = await getUserIdFromFastifyRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: writeJson(reply, 401, { message: "Usuario nao autenticado." }),
    }
  }

  return { ok: true as const, userId }
}
