import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useElementRect } from "./use-element-rect"

describe("useElementRect", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("remove listeners usando a mesma captura configurada no registro", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener")
    const element = document.createElement("div")
    document.body.appendChild(element)

    const { unmount } = renderHook(() =>
      useElementRect({ element, useResizeObserver: false })
    )

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      true
    )
    expect(removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
      true
    )
    element.remove()
  })
})
