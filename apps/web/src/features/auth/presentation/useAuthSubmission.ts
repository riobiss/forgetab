"use client"

import { useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { dismissToast } from "@/shared/presentation/notifications/toast"

type Options = {
  loadingMessage: string
  successMessage: string
  fallbackError: string
}

export function useAuthSubmission(options: Options) {
  const searchParams = useSearchParams()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)
  const rawNextPath = searchParams.get("next") || "/"
  const nextPath =
    rawNextPath.startsWith("/") && !rawNextPath.startsWith("//")
      ? rawNextPath
      : "/"

  function reportError(message: string) {
    setError(message)
    toast.error(message)
  }

  async function submit(action: () => Promise<unknown>) {
    if (submittingRef.current) return

    submittingRef.current = true
    setLoading(true)
    setError("")
    const loadingToastId = toast.loading(options.loadingMessage)

    try {
      await action()
      toast.success(options.successMessage)
      window.location.replace(nextPath)
    } catch (submissionError) {
      reportError(
        submissionError instanceof Error
          ? submissionError.message
          : options.fallbackError
      )
    } finally {
      dismissToast(loadingToastId)
      setLoading(false)
      submittingRef.current = false
    }
  }

  return { error, loading, nextPath, reportError, submit }
}
