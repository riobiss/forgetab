import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/shared/errors/AppError"
import { deleteScopedImage, uploadScopedImage } from "@/application/media/use-cases/scopedImages"
import { imageKitScopedImageService } from "@/infrastructure/media/imageKitScopedImageService"
import { getUserIdFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"

type Config = {
  folder: string
  defaultFileName: string
  allowDelete?: boolean
}

export function createScopedImageHandlers(config: Config) {
  function writeJson(reply: FastifyReply, status: number, body: unknown) {
    reply.code(status)
    reply.header("Content-Type", "application/json; charset=utf-8")
    return reply.send(body)
  }

  function writeError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
    if (error instanceof AppError) {
      return writeJson(reply, error.status, { message: error.message })
    }

    return writeJson(reply, 500, { message: fallbackMessage })
  }

  function buildFormDataRequest(request: FastifyRequest) {
    const rawBody = request.body
    const body =
      rawBody == null
        ? undefined
        : Buffer.isBuffer(rawBody)
          ? rawBody
          : typeof rawBody === "string"
            ? Buffer.from(rawBody)
            : rawBody instanceof ArrayBuffer
              ? Buffer.from(rawBody)
              : ArrayBuffer.isView(rawBody)
                ? Buffer.from(rawBody.buffer, rawBody.byteOffset, rawBody.byteLength)
                : Buffer.from(JSON.stringify(rawBody))

    return new Request("http://localhost/upload", {
      method: request.method,
      headers: new Headers(request.headers as Record<string, string>),
      body,
      duplex: body ? "half" : undefined,
    } as RequestInit & { duplex?: "half" })
  }

  async function postHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = await getUserIdFromFastifyRequest(request)
    if (!userId) {
      return writeJson(reply, 401, { message: "Usuario nao autenticado." })
    }

    try {
      const formData = await buildFormDataRequest(request).formData()
      const file = formData.get("file")
      const oldUrl = formData.get("oldUrl")
      const fileName =
        file instanceof File && file.name.trim().length > 0 ? file.name.trim() : config.defaultFileName

      const payload = await uploadScopedImage(
        { service: imageKitScopedImageService },
        {
          userId,
          folder: config.folder,
          fileName,
          file,
          oldUrl,
        },
      )

      return writeJson(
        reply,
        201,
        {
          message: "Imagem enviada com sucesso.",
          url: payload.url,
          fileId: payload.fileId,
          thumbnailUrl: payload.thumbnailUrl,
        },
      )
    } catch (error) {
      return writeError(reply, error, "Erro interno ao enviar imagem.")
    }
  }

  if (!config.allowDelete) {
    return { postHandler }
  }

  async function deleteHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = await getUserIdFromFastifyRequest(request)
    if (!userId) {
      return writeJson(reply, 401, { message: "Usuario nao autenticado." })
    }

    try {
      const body =
        request.body == null
          ? {}
          : Buffer.isBuffer(request.body)
            ? (JSON.parse(request.body.toString("utf8")) as { url?: unknown })
            : typeof request.body === "string"
              ? (JSON.parse(request.body) as { url?: unknown })
              : (request.body as { url?: unknown })
      await deleteScopedImage(
        { service: imageKitScopedImageService },
        {
          userId,
          folder: config.folder,
          url: body.url,
        },
      )

      return writeJson(reply, 200, { message: "Imagem removida com sucesso." })
    } catch (error) {
      return writeError(reply, error, "Erro interno ao remover imagem.")
    }
  }

  return { postHandler, deleteHandler }
}
