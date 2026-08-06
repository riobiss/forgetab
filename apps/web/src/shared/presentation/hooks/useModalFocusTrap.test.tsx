import { fireEvent, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useModalFocusTrap } from "./useModalFocusTrap"

afterEach(() => {
  document.body.innerHTML = ""
  document.body.removeAttribute("style")
})

describe("useModalFocusTrap", () => {
  it("move o foco, fecha com Escape e restaura o elemento anterior", async () => {
    const opener = document.createElement("button")
    const modal = document.createElement("section")
    const firstButton = document.createElement("button")
    const onEscape = vi.fn()
    modal.tabIndex = -1
    modal.append(firstButton)
    document.body.append(opener, modal)
    opener.focus()

    const modalRef = { current: modal }
    const { unmount } = renderHook(() =>
      useModalFocusTrap({
        isActive: true,
        activeElement: modalRef,
        onEscape
      })
    )

    await waitFor(() => expect(firstButton).toHaveFocus())
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onEscape).toHaveBeenCalledOnce()

    unmount()
    expect(opener).toHaveFocus()
  })

  it("mantem Tab e Shift+Tab dentro do modal", async () => {
    const modal = document.createElement("section")
    const firstButton = document.createElement("button")
    const lastButton = document.createElement("button")
    modal.append(firstButton, lastButton)
    document.body.append(modal)

    renderHook(() =>
      useModalFocusTrap({
        isActive: true,
        activeElement: { current: modal }
      })
    )

    await waitFor(() => expect(firstButton).toHaveFocus())
    lastButton.focus()
    fireEvent.keyDown(document, { key: "Tab" })
    expect(firstButton).toHaveFocus()

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true })
    expect(lastButton).toHaveFocus()
  })
})
