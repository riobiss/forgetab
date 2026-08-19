"use client"

import { LoaderCircle } from "lucide-react"
import { type RefObject, useEffect, useRef, useState } from "react"
import styles from "../LocalNotesPage.module.css"

type NotesPaginationSentinelProps = {
  scrollRootRef: RefObject<HTMLDivElement | null>
  hasMore: boolean
  isLoading: boolean
  error: string | null
  hasItems: boolean
  onLoadMore: () => void
}

export function NotesPaginationSentinel({
  scrollRootRef,
  hasMore,
  isLoading,
  error,
  hasItems,
  onLoadMore
}: NotesPaginationSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [manualFallback, setManualFallback] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    const scrollRoot = scrollRootRef.current
    if (!sentinel || !scrollRoot || !hasMore || isLoading || error) return
    if (typeof IntersectionObserver === "undefined") {
      setManualFallback(true)
      return
    }

    setManualFallback(false)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore()
      },
      { root: scrollRoot, rootMargin: "0px 0px 320px", threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [error, hasMore, isLoading, onLoadMore, scrollRootRef])

  if (!hasMore && hasItems) {
    return (
      <p className={styles.paginationEnd}>Todas as notas foram carregadas.</p>
    )
  }

  return (
    <div ref={sentinelRef} className={styles.paginationSentinel}>
      {isLoading ? (
        <span role="status">
          <LoaderCircle className={styles.spin} size={18} /> Carregando notas...
        </span>
      ) : error ? (
        <button type="button" onClick={onLoadMore}>
          Tentar carregar novamente
        </button>
      ) : manualFallback && hasMore ? (
        <button type="button" onClick={onLoadMore}>
          Carregar mais notas
        </button>
      ) : null}
    </div>
  )
}
