"use client"

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react"

const FOCUSABLE_SELECTORS = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ")

export function useModalFocusTrap(
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  const modalRef = useRef<HTMLElement | null>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previousFocusedElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      previousFocusedElementRef.current?.focus()
      return
    }

    const modalElement = modalRef.current
    if (!modalElement) return

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const getFocusableElements = () => {
      const currentModal = modalRef.current
      if (!currentModal) return []

      return Array.from(
        currentModal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      )
    }

    queueMicrotask(() => {
      ;(getFocusableElements()[0] ?? modalElement).focus()
    })

    function handleFocusIn(event: FocusEvent) {
      const currentModal = modalRef.current
      if (
        !currentModal ||
        (event.target instanceof HTMLElement &&
          currentModal.contains(event.target))
      ) {
        return
      }

      ;(getFocusableElements()[0] ?? currentModal).focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      const currentModal = modalRef.current
      if (!currentModal) return

      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== "Tab") return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        currentModal.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, setOpen])

  return modalRef
}
