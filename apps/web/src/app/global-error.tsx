"use client"

import { useEffect } from "react"
import { ErrorState } from "@/shared/presentation/feedback/ErrorState"

type GlobalErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({
  error,
  reset
}: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="pt-br">
      <body>
        <ErrorState
          global
          eyebrow="Erro"
          headingId="global-error-title"
          title="A aplicação encontrou um problema"
          description="Tente recarregar a tela. Se o erro continuar, volte para o início."
          retry={reset}
          secondaryLink={{ href: "/", label: "Voltar ao início" }}
        />
      </body>
    </html>
  )
}
