import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useThrottledCallback } from "./use-throttled-callback"

describe("useThrottledCallback", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("mantem a funcao estavel e executa a versao mais recente do callback", () => {
    vi.useFakeTimers()
    const firstCallback = vi.fn((value: string) => value)
    const latestCallback = vi.fn((value: string) => value)
    const { result, rerender } = renderHook(
      ({ callback }) => useThrottledCallback(callback, 100),
      { initialProps: { callback: firstCallback } }
    )
    const throttledCallback = result.current

    act(() => {
      result.current("value")
    })
    rerender({ callback: latestCallback })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe(throttledCallback)
    expect(firstCallback).not.toHaveBeenCalled()
    expect(latestCallback).toHaveBeenCalledWith("value")
  })

  it("cancela uma execucao pendente ao desmontar", () => {
    vi.useFakeTimers()
    const callback = vi.fn((value: string) => value)
    const { result, unmount } = renderHook(() =>
      useThrottledCallback(callback, 100)
    )

    act(() => {
      result.current("value")
    })
    unmount()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})
