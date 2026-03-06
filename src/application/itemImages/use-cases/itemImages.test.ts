import { beforeEach, describe, expect, it, vi } from "vitest"
import { deleteItemImage, uploadItemImage } from "@/application/itemImages/use-cases/itemImages"
import { AppError } from "@/shared/errors/AppError"

const service = {
  uploadItemImage: vi.fn(),
  deleteItemImageByUrl: vi.fn(),
}

describe("itemImages use-cases", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("valida arquivo obrigatorio no upload", async () => {
    await expect(
      uploadItemImage({ service }, { userId: "user-1", file: null }),
    ).rejects.toMatchObject<AppError>({ status: 400, message: "Arquivo de imagem e obrigatorio." })
  })

  it("delega upload quando arquivo e valido", async () => {
    const file = new File(["img"], "item.png", { type: "image/png" })
    service.uploadItemImage.mockResolvedValue({ url: "https://cdn/item.png", fileId: null, thumbnailUrl: null })

    const result = await uploadItemImage(
      { service },
      { userId: "user-1", file, oldUrl: "https://cdn/old.png" },
    )

    expect(result).toEqual({ url: "https://cdn/item.png", fileId: null, thumbnailUrl: null })
    expect(service.uploadItemImage).toHaveBeenCalledWith({
      userId: "user-1",
      file,
      oldUrl: "https://cdn/old.png",
    })
  })

  it("delega delete por url", async () => {
    await deleteItemImage({ service }, { userId: "user-1", url: "https://cdn/item.png" })

    expect(service.deleteItemImageByUrl).toHaveBeenCalledWith({
      userId: "user-1",
      url: "https://cdn/item.png",
    })
  })
})
