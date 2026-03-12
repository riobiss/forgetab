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
      <CharacterInventoryClient rpgId={rpgId} characterId={characterId} deps={deps} />
    </div>
  )
}
