import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  uploadScopedImage: vi.fn(),
  deleteScopedImage: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/application/media/use-cases/scopedImages", () => ({
  uploadScopedImage: mocks.uploadScopedImage,
  deleteScopedImage: mocks.deleteScopedImage,
}))

import {
  characterImageHandlers,
  itemImageHandlers,
  libraryImageHandlers,
  mapImageHandlers,
  markerImageHandlers,
  rpgImageHandlers,
  sectionImageHandlers,
} from "@api/presentation/routes/uploads/handlers"

function createUploadRequest() {
  const formData = new FormData()
  formData.append("file", new File(["fake-image-content"], "avatar.png", { type: "image/png" }))
  formData.append("oldUrl", "https://cdn.example.com/old.png")

  return {
    formData: async () => formData,
  } as Request
}

function createDeleteRequest(url: string) {
  return new Request("http://localhost/api/uploads/image", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  })
}

function getDeleteHandler(handlers: { deleteHandler?: (request: Request) => Promise<Response> }) {
  if (!handlers.deleteHandler) {
    throw new Error("Delete handler nao configurado.")
  }

  return handlers.deleteHandler
}

describe("upload routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  it("retorna 401 ao enviar imagem sem autenticacao", async () => {
    mocks.getUserIdFromRequest.mockResolvedValueOnce(null)

    const response = await characterImageHandlers.postHandler(createUploadRequest())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 201 ao enviar imagem de personagem", async () => {
    mocks.uploadScopedImage.mockResolvedValueOnce({
      url: "https://cdn.example.com/character.png",
      fileId: "file-1",
      thumbnailUrl: "https://cdn.example.com/thumb-character.png",
    })

    const response = await characterImageHandlers.postHandler(createUploadRequest())

    expect(response.status).toBe(201)
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
    await expect(response.json()).resolves.toEqual({
      message: "Imagem enviada com sucesso.",
      url: "https://cdn.example.com/character.png",
      fileId: "file-1",
      thumbnailUrl: "https://cdn.example.com/thumb-character.png",
    })
  })

  it("retorna 400 ao enviar imagem invalida", async () => {
    mocks.uploadScopedImage.mockRejectedValueOnce(new AppError("Arquivo de imagem invalido.", 400))

    const response = await itemImageHandlers.postHandler(createUploadRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: "Arquivo de imagem invalido." })
  })

  it("retorna 201 ao enviar imagem da biblioteca", async () => {
    mocks.uploadScopedImage.mockResolvedValueOnce({
      url: "https://cdn.example.com/library.png",
      fileId: "file-2",
      thumbnailUrl: "https://cdn.example.com/thumb-library.png",
    })

    const response = await libraryImageHandlers.postHandler(createUploadRequest())

    expect(response.status).toBe(201)
    expect(mocks.uploadScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        folder: "library",
        userId: "user-1",
      }),
    )
    await expect(response.json()).resolves.toEqual({
      message: "Imagem enviada com sucesso.",
      url: "https://cdn.example.com/library.png",
      fileId: "file-2",
      thumbnailUrl: "https://cdn.example.com/thumb-library.png",
    })
  })

  it("retorna 200 ao remover imagem de item", async () => {
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await getDeleteHandler(itemImageHandlers)(
      createDeleteRequest("https://cdn.example.com/item.png"),
    )

    expect(response.status).toBe(200)
    expect(mocks.deleteScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        userId: "user-1",
        folder: "items",
        url: "https://cdn.example.com/item.png",
      }),
    )
    await expect(response.json()).resolves.toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 200 ao remover imagem de personagem", async () => {
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await getDeleteHandler(characterImageHandlers)(
      createDeleteRequest("https://cdn.example.com/character.png"),
    )

    expect(response.status).toBe(200)
    expect(mocks.deleteScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        userId: "user-1",
        folder: "characters",
        url: "https://cdn.example.com/character.png",
      }),
    )
    await expect(response.json()).resolves.toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 403 ao remover imagem sem permissao", async () => {
    mocks.deleteScopedImage.mockRejectedValueOnce(new AppError("Voce nao pode remover esta imagem.", 403))

    const response = await getDeleteHandler(mapImageHandlers)(
      createDeleteRequest("https://cdn.example.com/map.png"),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ message: "Voce nao pode remover esta imagem." })
  })

  it("retorna 200 ao remover imagem de RPG", async () => {
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await getDeleteHandler(rpgImageHandlers)(
      createDeleteRequest("https://cdn.example.com/rpg.png"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 200 ao remover imagem de marcador", async () => {
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await getDeleteHandler(markerImageHandlers)(
      createDeleteRequest("https://cdn.example.com/marker.png"),
    )

    expect(response.status).toBe(200)
    expect(mocks.deleteScopedImage).toHaveBeenCalledWith(
      { service: expect.anything() },
      expect.objectContaining({
        userId: "user-1",
        folder: "markers",
        url: "https://cdn.example.com/marker.png",
      }),
    )
    await expect(response.json()).resolves.toEqual({ message: "Imagem removida com sucesso." })
  })

  it("retorna 200 ao remover imagem de secao", async () => {
    mocks.deleteScopedImage.mockResolvedValueOnce(undefined)

    const response = await getDeleteHandler(sectionImageHandlers)(
      createDeleteRequest("https://cdn.example.com/section.png"),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ message: "Imagem removida com sucesso." })
  })
})
