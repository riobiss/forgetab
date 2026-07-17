"use client"

import Link from "next/link"
import { useEffect } from "react"
import styles from "./error-state.module.css"

type GlobalErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="pt-br">
      <body>
        <main className={`${styles.page} ${styles.globalPage}`}>
          <section className={styles.panel} aria-labelledby="global-error-title">
            <p className={styles.eyebrow}>Erro</p>
            <h1 id="global-error-title" className={styles.title}>
              A aplicação encontrou um problema
            </h1>
            <p className={styles.description}>
              Tente recarregar a tela. Se o erro continuar, volte para o início.
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryAction} type="button" onClick={reset}>
                Tentar novamente
              </button>
              <Link className={styles.secondaryAction} href="/">
                Voltar ao início
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
