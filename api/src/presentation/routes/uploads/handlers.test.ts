import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  jwtSecret: (process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret"),
  getUserIdFromFastifyRequest: vi.fn(),
  uploadScopedImage: vi.fn(),
  deleteScopedImage: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromFastifyRequest: mocks.getUserIdFromFastifyRequest,
}))

vi.mock("@/application/media/use-cases/scopedImages", () => ({
  uploadScopedImage: mocks.uploadScopedImage,
  deleteScopedImage: mocks.deleteScopedImage,
}))

import { buildApiServer } from "@api/app"

async function createMultipartPayload() {
  const formData = new FormData()
  formData.append("file", new File(["fake-image-content"], "avatar.png", { type: "image/png" }))
  formData.append("oldUrl", "https://cdn.example.com/old.png")

  const request = new Request("http://localhost/api/uploads/image", {
    method: "POST",
    body: formData,
  })

  return {
    payload: Buffer.from(await request.arrayBuffer()),
    contentType: request.headers.get("content-type") ?? "multipart/form-data",
  }
}

describe("upload routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromFastifyRequest.mockResolvedValue("user-1")
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao enviar imagem sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromFastifyRequest.mockResolvedValueOnce(null)
    const multipart = await createMultipartPayload()

    const response = await server.inject({
      method: "POST",
      url: "/api/uploads/character-image",
      payload: multipart.payload,
      headers: {
        "content-type": multipart.contentType,
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 201 ao enviar imagem de personagem", async () => {
    server = buildApiServer()
    mocks.uploadScopedImage.mockResolvedValueOnce({
      url: "https://cdn.example.com/character.png",
      fileId: "file-1",
      thumbnailUrl: "https://cdn.example.com/thumb-character.png",
    })
    const multipart = await createMultipartPayload()

    const response = await server.inject({
      method: "POST",
      url: "/api/uploads/character-image",
      payload: multipart.payload,
      headers: {
        "content-type": multipart.contentType,
      },
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.uploadScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        userId: "user-1",
        folder: "characters",
        fileName: "avatar.png",
        oldUrl: "https://cdn.example.com/old.png",
        file: expect.any(File),
      }),
    )
    expect(response.json()).toEqual({
      message: "Imagem enviada com sucesso.",
      url: "https://cdn.example.com/character.png",
      fileId: "file-1",
      thumbnailUrl: "https://cdn.example.com/thumb-character.png",
    })
  })

  it("retorna 400 ao enviar imagem invalida", async () => {
    server = buildApiServer()
    mocks.uploadScopedImage.mockRejectedValueOnce(new AppError("Arquivo de imagem invalido.", 400))
    const multipart = await createMultipartPayload()

    const response = await server.inject({
      method: "POST",
      url: "/api/uploads/item-image",
      payload: multipart.payload,
      headers: {
        "content-type": multipart.contentType,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: "Arquivo de imagem invalido." })
  })

  it("retorna 201 ao enviar imagem da biblioteca", async () => {
    server = buildApiServer()
    mocks.uploadScopedImage.mockResolvedValueOnce({
      url: "https://cdn.example.com/library.png",
      fileId: "file-2",
      thumbnailUrl: "https://cdn.example.com/thumb-library.png",
    })
    const multipart = await createMultipartPayload()

    const response = await server.inject({
      method: "POST",
      url: "/api/uploads/library-image",
      payload: multipart.payload,
      headers: {
        "content-type": multipart.contentType,
      },
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.uploadScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        folder: "library",
        userId: "user-1",
      }),
    )
    expect(response.json()).toEqual({
      message: "Imagem enviada com sucesso.",
      url: "https://cdn.example.com/library.png",
      fileId: "file-2",
      thumbnailUrl: "https://cdn.example.com/thumb-library.png",
    })
  })

  it("retorna 200 ao remover imagem de item", async () => {
    server = buildApiServer()
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await server.inject({
      method: "DELETE",
      url: "/api/uploads/item-image",
      payload: { url: "https://cdn.example.com/item.png" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.deleteScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        userId: "user-1",
        folder: "items",
        url: "https://cdn.example.com/item.png",
      }),
    )
    expect(response.json()).toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 200 ao remover imagem de personagem", async () => {
    server = buildApiServer()
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await server.inject({
      method: "DELETE",
      url: "/api/uploads/character-image",
      payload: { url: "https://cdn.example.com/character.png" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.deleteScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        userId: "user-1",
        folder: "characters",
        url: "https://cdn.example.com/character.png",
      }),
    )
    expect(response.json()).toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 403 ao remover imagem sem permissao", async () => {
    server = buildApiServer()
    mocks.deleteScopedImage.mockRejectedValueOnce(
      new AppError("Voce nao pode remover esta imagem.", 403),
    )

    const response = await server.inject({
      method: "DELETE",
      url: "/api/uploads/map-image",
      payload: { url: "https://cdn.example.com/map.png" },
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ message: "Voce nao pode remover esta imagem." })
  })

  it("retorna 200 ao remover imagem de RPG", async () => {
    server = buildApiServer()
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await server.inject({
      method: "DELETE",
      url: "/api/uploads/rpg-image",
      payload: { url: "https://cdn.example.com/rpg.png" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 200 ao remover imagem de marcador", async () => {
    server = buildApiServer()
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await server.inject({
      method: "DELETE",
      url: "/api/uploads/marker-image",
      payload: { url: "https://cdn.example.com/marker.png" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.deleteScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        userId: "user-1",
        folder: "markers",
        url: "https://cdn.example.com/marker.png",
      }),
    )
    expect(response.json()).toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 200 ao remover imagem de secao", async () => {
    server = buildApiServer()
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await server.inject({
      method: "DELETE",
      url: "/api/uploads/section-image",
      payload: { url: "https://cdn.example.com/section.png" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Imagem removida com sucesso." })
  })
})
