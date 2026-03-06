import { beforeEach, describe, expect, it, vi } from "vitest"
import { deleteScopedImage, uploadScopedImage } from "@/application/media/use-cases/scopedImages"
import { AppError } from "@/shared/errors/AppError"

const service = {
  upload: vi.fn(),
  deleteByUrl: vi.fn(),
}

describe("scopedImages use-cases", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("valida arquivo obrigatorio no upload", async () => {
    await expect(
      uploadScopedImage({ service }, { userId: "u1", folder: "items", fileName: "item.jpg", file: null }),
    ).rejects.toMatchObject<AppError>({ status: 400, message: "Arquivo de imagem e obrigatorio." })
  })

  it("delega upload com configuracao de escopo", async () => {
    const file = new File(["img"], "asset.png", { type: "image/png" })
    service.upload.mockResolvedValue({ url: "https://cdn/asset.png", fileId: null, thumbnailUrl: null })

    const result = await uploadScopedImage(
      { service },
      { userId: "u1", folder: "maps", fileName: "map-image.jpg", file, oldUrl: "https://cdn/old.png" },
    )

    expect(result).toEqual({ url: "https://cdn/asset.png", fileId: null, thumbnailUrl: null })
    expect(service.upload).toHaveBeenCalledWith({
      userId: "u1",
      folder: "maps",
      fileName: "map-image.jpg",
      file,
      oldUrl: "https://cdn/old.png",
    })
  })

  it("delega delete com configuracao de escopo", async () => {
    await deleteScopedImage({ service }, { userId: "u1", folder: "library", url: "https://cdn/lib.png" })

    expect(service.deleteByUrl).toHaveBeenCalledWith({
      userId: "u1",
      folder: "library",
      url: "https://cdn/lib.png",
    })
  })
})
