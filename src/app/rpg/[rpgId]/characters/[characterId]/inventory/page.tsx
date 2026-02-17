import Link from "next/link"
import { notFound } from "next/navigation"
import styles from "./page.module.css"
import InventoryClient from "./InventoryClient"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function InventoryPage({ params }: Params) {
  const { rpgId, characterId } = await params

  if (!characterId) {
    notFound()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Inventario</p>
          <h1 className={styles.title}>Personagem</h1>
        </div>
        <Link href={`/rpg/${rpgId}/characters/${characterId}`} className={styles.backLink}>
          Voltar para ficha
        </Link>
      </div>

      <InventoryClient rpgId={rpgId} characterId={characterId} />
    </div>
  )
}
