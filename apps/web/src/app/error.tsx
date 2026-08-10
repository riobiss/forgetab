"use client"

import { useEffect } from "react"
import { ErrorState } from "@/shared/presentation/feedback/ErrorState"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      eyebrow="Erro"
      headingId="error-title"
      title="Não foi possível carregar esta página"
      description="Tente novamente. Se o problema continuar, volte para uma área estável da aplicação."
      retry={reset}
      secondaryLink={{ href: "/rpg", label: "Ir para campanhas" }}
    />
  )
}
