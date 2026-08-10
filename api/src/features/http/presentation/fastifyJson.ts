import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/features/shared/application/errors/AppError"
import { getUserIdFromFastifyRequest } from "@/features/http/presentation/auth/requestAuth"

export function parseJsonBody<T = unknown>(body: unknown): T {
  if (body == null) {
    return null as T
  }

  if (Buffer.isBuffer(body)) {
    const raw = body.toString("utf8").trim()
    return raw ? parseJson<T>(raw) : (null as T)
  }

  if (typeof body === "string") {
    const raw = body.trim()
    return raw ? parseJson<T>(raw) : (null as T)
  }

  return body as T
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new AppError("JSON invalido.", 400)
  }
}

export function writeJson(reply: FastifyReply, status: number, body: unknown) {
  reply.code(status)
  reply.header("Content-Type", "application/json; charset=utf-8")
  return reply.send(body)
}

export function writeError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string
) {
  if (error instanceof AppError) {
    return writeJson(reply, error.status, { message: error.message })
  }

  return writeJson(reply, 500, { message: fallbackMessage })
}

export async function requireUserId(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = await getUserIdFromFastifyRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: writeJson(reply, 401, { message: "Usuario nao autenticado." })
    }
  }

  return { ok: true as const, userId }
}
