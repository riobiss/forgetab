"use client"

import { useEffect, useRef, type RefObject } from "react"

type ModalElementSource =
  | HTMLElement
  | null
  | RefObject<HTMLElement | null>
  | (() => HTMLElement | null)

type Params = {
  isActive: boolean
  activeElement: ModalElementSource
  backgroundElement?: HTMLElement | null
  onEscape?: () => void
  restoreFocus?: boolean
}

const FOCUSABLE_SELECTORS = [
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[role='combobox']:not([aria-disabled='true'])",
  "[tabindex]:not([tabindex='-1'])"
].join(", ")

function resolveModalElement(source: ModalElementSource) {
  if (typeof source === "function") return source()
  if (source && "current" in source) return source.current
  return source
}

function isAllowedPortalTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest("[data-modal-portal-allow='true']") ||
      target.closest("[data-radix-popper-content-wrapper]") ||
      target.closest('[role="listbox"]')
    )
  )
}

export function useModalFocusTrap({
  isActive,
  activeElement,
  backgroundElement,
  onEscape,
  restoreFocus = true
}: Params) {
  const onEscapeRef = useRef(onEscape)

  useEffect(() => {
    onEscapeRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    if (!isActive) return

    const resolvedModalElement = resolveModalElement(activeElement)
    if (!resolvedModalElement) return
    const modalElement: HTMLElement = resolvedModalElement

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
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

    const getFocusableElements = () =>
      Array.from(
        modalElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true"
      )

    queueMicrotask(() => {
      const currentFocusedElement = document.activeElement
      if (
        currentFocusedElement instanceof HTMLElement &&
        modalElement.contains(currentFocusedElement)
      ) {
        return
      }

      ;(getFocusableElements()[0] ?? modalElement).focus()
    })

    function handleFocusIn(event: FocusEvent) {
      if (
        event.target === document.body ||
        event.target === document.documentElement ||
        isAllowedPortalTarget(event.target) ||
        (event.target instanceof HTMLElement &&
          modalElement.contains(event.target))
      ) {
        return
      }

      ;(getFocusableElements()[0] ?? modalElement).focus()
    }

    function blockBackgroundInteraction(event: Event) {
      if (
        !backgroundElement ||
        isAllowedPortalTarget(event.target) ||
        (event.target instanceof Node && modalElement.contains(event.target))
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && onEscapeRef.current) {
        event.preventDefault()
        onEscapeRef.current()
        return
      }

      if (event.key !== "Tab") return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        modalElement.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const focusedElement = document.activeElement

      if (event.shiftKey && focusedElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && focusedElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", blockBackgroundInteraction, true)
    document.addEventListener("touchmove", blockBackgroundInteraction, {
      capture: true,
      passive: false
    })
    document.addEventListener("wheel", blockBackgroundInteraction, {
      capture: true,
      passive: false
    })

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
      document.removeEventListener(
        "pointerdown",
        blockBackgroundInteraction,
        true
      )
      document.removeEventListener(
        "touchmove",
        blockBackgroundInteraction,
        true
      )
      document.removeEventListener("wheel", blockBackgroundInteraction, true)

      if (restoreFocus) previouslyFocusedElement?.focus()
    }
  }, [activeElement, backgroundElement, isActive, restoreFocus])
}
