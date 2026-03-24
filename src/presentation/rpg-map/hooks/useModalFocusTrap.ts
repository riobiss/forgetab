"use client"

import { useEffect, useRef } from "react"

type Params = {
  activeElement: HTMLElement | null
  backgroundElement?: HTMLElement | null
  onEscape: () => void
}

export function useModalFocusTrap({ activeElement, backgroundElement, onEscape }: Params) {
  const onEscapeRef = useRef(onEscape)

  useEffect(() => {
    onEscapeRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    if (!activeElement) {
      return
    }

    const modalElement = activeElement
    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    const previousOverscrollBehavior = document.body.style.overscrollBehavior
    const previousPointerEvents = backgroundElement?.style.pointerEvents ?? ""
    const previousAriaHidden = backgroundElement?.getAttribute("aria-hidden")
    const previousInert = backgroundElement?.inert ?? false
    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"
    document.body.style.overscrollBehavior = "contain"

    if (backgroundElement) {
      backgroundElement.inert = true
      backgroundElement.setAttribute("aria-hidden", "true")
      backgroundElement.style.pointerEvents = "none"
    }

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

    const isAllowedPortalTarget = (target: EventTarget | null) =>
      target instanceof HTMLElement && Boolean(target.closest("[data-modal-portal-allow='true']"))

    queueMicrotask(() => {
      const currentFocusedElement = document.activeElement
      if (currentFocusedElement instanceof HTMLElement && modalElement.contains(currentFocusedElement)) {
        return
      }

      const firstFocusable = getFocusableElements()[0] ?? modalElement
      firstFocusable.focus()
    })

    function handleFocusIn(event: FocusEvent) {
      if (event.target === document.body || event.target === document.documentElement) {
        return
      }

      if (isAllowedPortalTarget(event.target)) {
        return
      }

      if (event.target instanceof HTMLElement && modalElement.contains(event.target)) {
        return
      }

      const firstElement = getFocusableElements()[0] ?? modalElement
      firstElement.focus()
    }

    function blockBackgroundInteraction(event: Event) {
      if (isAllowedPortalTarget(event.target)) {
        return
      }

      if (event.target instanceof Node && modalElement.contains(event.target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscapeRef.current()
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
    document.addEventListener("pointerdown", blockBackgroundInteraction, true)
    document.addEventListener("touchmove", blockBackgroundInteraction, { capture: true, passive: false })
    document.addEventListener("wheel", blockBackgroundInteraction, { capture: true, passive: false })

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      document.body.style.overscrollBehavior = previousOverscrollBehavior

      if (backgroundElement) {
        backgroundElement.inert = previousInert
        if (previousAriaHidden == null) {
          backgroundElement.removeAttribute("aria-hidden")
        } else {
          backgroundElement.setAttribute("aria-hidden", previousAriaHidden)
        }
        backgroundElement.style.pointerEvents = previousPointerEvents
      }

      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", blockBackgroundInteraction, true)
      document.removeEventListener("touchmove", blockBackgroundInteraction, true)
      document.removeEventListener("wheel", blockBackgroundInteraction, true)
    }
  }, [activeElement, backgroundElement])
}
