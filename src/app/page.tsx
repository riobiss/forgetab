import Link from "next/link"
import styles from "./page.module.css"

export default function HomePage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2 className={styles.title}>forgetab</h2>
        <h2 className={styles.start}>
          <Link href="/combat">Começar</Link>
        </h2>
      </main>
    </div>
  )
}
