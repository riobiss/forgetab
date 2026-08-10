import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useWindowSize } from "./use-window-size"

describe("useWindowSize", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("usa as dimensoes da janela quando Visual Viewport nao existe", () => {
    vi.useFakeTimers()
    const removeEventListener = vi.spyOn(window, "removeEventListener")
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined
    })
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280
    })
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 720
    })

    const { result, unmount } = renderHook(() => useWindowSize())
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toEqual({
      width: 1280,
      height: 720,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1
    })

    unmount()
    expect(removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    )
    expect(removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    )
  })
})
