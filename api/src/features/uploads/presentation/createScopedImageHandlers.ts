import type { FastifyReply, FastifyRequest } from "fastify"
import {
  deleteScopedImage,
  uploadScopedImage
} from "@/features/media/application/use-cases/scopedImages"
import type { ScopedImageService } from "@/features/media/application/ports/ScopedImageService"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson
} from "@/features/http/presentation/fastifyJson"

type Config = {
  folder: string
  defaultFileName: string
  allowDelete?: boolean
}

type Dependencies = {
  service: ScopedImageService
}

export function createScopedImageHandlers(config: Config, deps: Dependencies) {
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
                ? Buffer.from(
                    rawBody.buffer,
                    rawBody.byteOffset,
                    rawBody.byteLength
                  )
                : Buffer.from(JSON.stringify(rawBody))

    return new Request("http://localhost/upload", {
      method: request.method,
      headers: new Headers(request.headers as Record<string, string>),
      body,
      duplex: body ? "half" : undefined
    } as RequestInit & { duplex?: "half" })
  }

  async function postHandler(request: FastifyRequest, reply: FastifyReply) {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    try {
      const formData = await buildFormDataRequest(request).formData()
      const file = formData.get("file")
      const oldUrl = formData.get("oldUrl")
      const fileName =
        file instanceof File && file.name.trim().length > 0
          ? file.name.trim()
          : config.defaultFileName

      const payload = await uploadScopedImage(deps, {
        userId: auth.userId,
        folder: config.folder,
        fileName,
        file,
        oldUrl
      })

      return writeJson(reply, 201, {
        message: "Imagem enviada com sucesso.",
        url: payload.url,
        fileId: payload.fileId,
        thumbnailUrl: payload.thumbnailUrl
      })
    } catch (error) {
      return writeError(reply, error, "Erro interno ao enviar imagem.")
    }
  }

  if (!config.allowDelete) {
    return { postHandler }
  }

  async function deleteHandler(request: FastifyRequest, reply: FastifyReply) {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    try {
      const body = (parseJsonBody(request.body) ?? {}) as { url?: unknown }
      await deleteScopedImage(deps, {
        userId: auth.userId,
        folder: config.folder,
        url: body.url
      })

      return writeJson(reply, 200, { message: "Imagem removida com sucesso." })
    } catch (error) {
      return writeError(reply, error, "Erro interno ao remover imagem.")
    }
  }

  return { postHandler, deleteHandler }
}
