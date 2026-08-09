import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useFileUpload, type UploadOptions } from "./use-file-upload"

function createOptions(overrides: Partial<UploadOptions> = {}): UploadOptions {
  return {
    accept: "image/*",
    limit: 3,
    maxSize: 1024,
    upload: vi.fn(async () => "https://cdn.example.com/image.png"),
    ...overrides
  }
}

describe("useFileUpload", () => {
  it("rejeita arquivos que nao atendem ao contrato accept", async () => {
    const onError = vi.fn()
    const options = createOptions({ onError })
    const { result } = renderHook(() => useFileUpload(options))

    let urls: string[] = []
    await act(async () => {
      urls = await result.current.uploadFiles([
        new File(["text"], "notes.txt", { type: "text/plain" })
      ])
    })

    expect(urls).toEqual([])
    expect(options.upload).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "File type is not allowed: text/plain"
      })
    )
  })

  it("trata tamanho zero como limite ilimitado", async () => {
    const options = createOptions({ maxSize: 0 })
    const { result } = renderHook(() => useFileUpload(options))

    let urls: string[] = []
    await act(async () => {
      urls = await result.current.uploadFiles([
        new File(["large-image"], "image.png", { type: "image/png" })
      ])
    })

    expect(urls).toEqual(["https://cdn.example.com/image.png"])
    expect(options.upload).toHaveBeenCalledOnce()
  })

  it("respeita o limite de quantidade antes de iniciar uploads", async () => {
    const onError = vi.fn()
    const options = createOptions({ limit: 1, onError })
    const { result } = renderHook(() => useFileUpload(options))

    await act(async () => {
      await result.current.uploadFiles([
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" })
      ])
    })

    expect(options.upload).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Maximum 1 file allowed" })
    )
  })
})
