"use client"

import { useEffect } from "react"

type Params = {
  activeElement: HTMLElement | null
  onEscape: () => void
}

export function useModalFocusTrap({ activeElement, onEscape }: Params) {
  useEffect(() => {
    if (!activeElement) {
      return
    }

    const modalElement = activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ")

    const getFocusableElements = () =>
      Array.from(modalElement.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
      )

    const firstFocusable = getFocusableElements()[0] ?? modalElement
    queueMicrotask(() => {
      firstFocusable.focus()
    })

    function handleFocusIn(event: FocusEvent) {
      if (event.target instanceof HTMLElement && modalElement.contains(event.target)) {
        return
      }

      const firstElement = getFocusableElements()[0] ?? modalElement
      firstElement.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscape()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        modalElement.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeFocusedElement = document.activeElement

      if (event.shiftKey && activeFocusedElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeFocusedElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeElement, onEscape])
}
