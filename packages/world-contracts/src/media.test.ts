import { describe, expect, it } from "vitest"
import { isAllowedImageMimeType } from "./media"

describe("isAllowedImageMimeType", () => {
  it.each(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"])(
    "aceita o formato raster %s",
    (mimeType) => {
      expect(isAllowedImageMimeType(mimeType)).toBe(true)
    }
  )

  it("rejeita SVG por nao ser um formato raster seguro", () => {
    expect(isAllowedImageMimeType("image/svg+xml")).toBe(false)
  })
})
