import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { imageKitScopedImageService } from "./imageKitScopedImageService"

describe("imageKitScopedImageService", () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", fetchMock)
    vi.stubEnv("IMAGEKIT_PRIVATE_KEY", "private-key")
    vi.stubEnv("IMAGEKIT_URL_ENDPOINT", "https://ik.imagekit.io/forgetab")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("remove a imagem antiga do mesmo escopo antes de enviar uma nova", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              fileId: "old-file",
              url: "https://ik.imagekit.io/forgetab/users/user-1/characters/old.png",
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            url: "https://ik.imagekit.io/forgetab/users/user-1/characters/new.png",
            fileId: "new-file",
            thumbnailUrl: "https://ik.imagekit.io/forgetab/users/user-1/characters/tr:n-thumb/new.png",
          }),
          { status: 200 },
        ),
      )

    const result = await imageKitScopedImageService.upload({
      userId: "user-1",
      folder: "characters",
      fileName: "avatar.png",
      file: new File(["fake-image"], "avatar.png", { type: "image/png" }),
      oldUrl: "https://ik.imagekit.io/forgetab/users/user-1/characters/old.png",
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0]?.[0]).toContain("https://api.imagekit.io/v1/files?limit=100")
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.imagekit.io/v1/files/old-file")
    expect(fetchMock.mock.calls[2]?.[0]).toBe("https://upload.imagekit.io/api/v1/files/upload")
    expect(result).toEqual({
      url: "https://ik.imagekit.io/forgetab/users/user-1/characters/new.png",
      fileId: "new-file",
      thumbnailUrl: "https://ik.imagekit.io/forgetab/users/user-1/characters/tr:n-thumb/new.png",
    })
  })

  it("ignora a remocao da imagem antiga quando a URL nao pertence ao endpoint configurado", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          url: "https://ik.imagekit.io/forgetab/users/user-1/items/item.png",
          fileId: "new-file",
          thumbnailUrl: "https://ik.imagekit.io/forgetab/thumb-item.png",
        }),
        { status: 200 },
      ),
    )

    await imageKitScopedImageService.upload({
      userId: "user-1",
      folder: "items",
      fileName: "item.png",
      file: new File(["fake-image"], "item.png", { type: "image/png" }),
      oldUrl: "https://cdn.example.com/item.png",
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://upload.imagekit.io/api/v1/files/upload")
  })

  it("remove uma imagem existente quando a URL pertence ao host e folder permitidos", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              fileId: "file-to-delete",
              url: "https://ik.imagekit.io/forgetab/users/user-1/maps/map.png",
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await imageKitScopedImageService.deleteByUrl({
      userId: "user-1",
      folder: "maps",
      url: "https://ik.imagekit.io/forgetab/users/user-1/maps/map.png",
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toContain("https://api.imagekit.io/v1/files?limit=100")
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.imagekit.io/v1/files/file-to-delete")
  })

  it("ignora a remocao quando a URL esta fora do folder permitido", async () => {
    await imageKitScopedImageService.deleteByUrl({
      userId: "user-1",
      folder: "maps",
      url: "https://ik.imagekit.io/forgetab/users/user-1/characters/char.png",
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
