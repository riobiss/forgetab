import Link from "next/link"
import type { CharacterInventoryDependencies } from "@/application/characterInventory/contracts/CharacterInventoryDependencies"
import CharacterInventoryClient from "./CharacterInventoryClient"
import styles from "./CharacterInventoryPage.module.css"

type CharacterInventoryPageProps = {
  rpgId: string
  characterId: string
  deps: CharacterInventoryDependencies
}

export default function CharacterInventoryPage({
  rpgId,
  characterId,
  deps,
}: CharacterInventoryPageProps) {
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

      <CharacterInventoryClient rpgId={rpgId} characterId={characterId} deps={deps} />
    </div>
  )
}
