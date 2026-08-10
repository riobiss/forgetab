import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useScrolling } from "./use-scrolling"

describe("useScrolling", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("mantem os listeners durante a rolagem e os remove com capture", () => {
    vi.useFakeTimers()
    const addEventListener = vi.spyOn(window, "addEventListener")
    const removeEventListener = vi.spyOn(window, "removeEventListener")
    const { result, unmount } = renderHook(() =>
      useScrolling(window, { debounce: 100, fallbackToDocument: false })
    )
    const scrollRegistration = addEventListener.mock.calls.find(
      ([event, , capture]) => event === "scroll" && capture === true
    )
    const scrollHandler = scrollRegistration?.[1]
    const registrationsBeforeScroll = addEventListener.mock.calls.length

    expect(scrollHandler).toBeTypeOf("function")
    act(() => {
      ;(scrollHandler as EventListener)(new Event("scroll"))
    })

    expect(result.current).toBe(true)
    expect(addEventListener).toHaveBeenCalledTimes(registrationsBeforeScroll)

    const scrollEndHandler = addEventListener.mock.calls.find(
      ([event, , capture]) => event === "scrollend" && capture === true
    )?.[1]
    act(() => {
      if (scrollEndHandler) {
        ;(scrollEndHandler as EventListener)(new Event("scrollend"))
      } else {
        vi.advanceTimersByTime(100)
      }
    })
    expect(result.current).toBe(false)

    unmount()
    expect(removeEventListener).toHaveBeenCalledWith(
      "scroll",
      scrollHandler,
      true
    )
  })
})
