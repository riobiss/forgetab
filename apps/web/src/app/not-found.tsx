import Link from "next/link"
import styles from "./error-state.module.css"

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <p className={styles.eyebrow}>404</p>
        <h1 id="not-found-title" className={styles.title}>
          Página não encontrada
        </h1>
        <p className={styles.description}>
          O conteúdo solicitado não existe, foi removido ou você não tem acesso
          a ele.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/rpg">
            Ir para campanhas
          </Link>
          <Link className={styles.secondaryAction} href="/">
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  )
}
