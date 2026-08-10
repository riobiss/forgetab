import { describe, expect, it } from "vitest"
import { appendImageFile } from "./appendImageFile"

describe("appendImageFile", () => {
  it("adapta o contrato binario puro para FormData", async () => {
    const formData = new FormData()

    await appendImageFile(formData, "file", {
      name: "map.png",
      type: "image/png",
      size: 3,
      async arrayBuffer() {
        return new Uint8Array([1, 2, 3]).buffer
      }
    })

    const file = formData.get("file")
    expect(file).toBeInstanceOf(File)
    expect(file).toMatchObject({ name: "map.png", type: "image/png", size: 3 })
  })
})
