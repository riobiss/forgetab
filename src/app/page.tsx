import Link from "next/link"
import styles from "./page.module.css"

export default function HomePage() {
  const highlights = [
    {
      title: "Mundo vivo",
      description: "Crie campanhas com mapa, raças, classes, itens e biblioteca própria.",
    },
    {
      title: "Combate tático",
      description: "Organize turnos, ataques e status com fluxo rápido para mesa online.",
    },
    {
      title: "Progressão sólida",
      description: "Gerencie habilidades, evolução e decisões de personagem sem planilhas.",
    },
  ]

  return (
    <div className={styles.page}>
      <main className={styles.main} role="main">
        <section className={styles.hero}>
          <p className={styles.kicker}>Plataforma para campanhas de RPG</p>
          <h1 className={styles.title}>ForgeTab</h1>
          <p className={styles.subtitle}>
            Monte universos, organize personagens e conduza combates com uma interface
            moderna para narradores e jogadores.
          </p>

          <div className={styles.actions}>
            <Link href="/rpg" className={styles.primaryAction}>
              Explorar campanhas
            </Link>
            <Link href="/combat" className={styles.secondaryAction}>
              Ir para combate
            </Link>
          </div>
        </section>

        <section className={styles.highlights} aria-label="Recursos principais">
          {highlights.map((highlight) => (
            <article key={highlight.title} className={styles.card}>
              <h2>{highlight.title}</h2>
              <p>{highlight.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
