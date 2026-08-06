"use client"

import Link from "next/link"
import { useEffect } from "react"
import styles from "./error-state.module.css"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="error-title">
        <p className={styles.eyebrow}>Erro</p>
        <h1 id="error-title" className={styles.title}>
          Não foi possível carregar esta página
        </h1>
        <p className={styles.description}>
          Tente novamente. Se o problema continuar, volte para uma área estável
          da aplicação.
        </p>
        <div className={styles.actions}>
          <button
            className={styles.primaryAction}
            type="button"
            onClick={reset}
          >
            Tentar novamente
          </button>
          <Link className={styles.secondaryAction} href="/rpg">
            Ir para campanhas
          </Link>
        </div>
      </section>
    </main>
  )
}
