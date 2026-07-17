"use client"

import { useEffect } from "react"

export default function PerformanceMeasureGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    if (typeof window === "undefined" || typeof performance === "undefined") return

    const proto = Object.getPrototypeOf(performance) as Performance & {
      __forgetabOriginalMeasure?: Performance["measure"]
      __forgetabMeasureGuardApplied?: boolean
    }

    if (proto.__forgetabMeasureGuardApplied) return
    const originalMeasure = proto.measure

    proto.measure = ((...args: Parameters<Performance["measure"]>) => {
      try {
        return originalMeasure.apply(performance, args)
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("cannot have a negative time stamp")) {
          return undefined as unknown as PerformanceMeasure
        }
        throw error
      }
    }) as Performance["measure"]

    proto.__forgetabOriginalMeasure = originalMeasure
    proto.__forgetabMeasureGuardApplied = true

    return () => {
      if (!proto.__forgetabMeasureGuardApplied || !proto.__forgetabOriginalMeasure) return
      proto.measure = proto.__forgetabOriginalMeasure
      proto.__forgetabOriginalMeasure = undefined
      proto.__forgetabMeasureGuardApplied = false
    }
  }, [])

  return null
}
