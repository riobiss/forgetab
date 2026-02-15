import Link from "next/link"
import { notFound } from "next/navigation"
import players from "@/data/rpg/world-of-clans/entities/player"
import { items } from "@/data/rpg/world-of-clans/items/items"
import styles from "./page.module.css"
import InventoryClient from "./InventoryClient"
import InventoryCards from "./components/InventoryCards"
import { InventoryCardItem, InventoryRarity } from "./types"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

const staticRarityClassMap: Record<string, InventoryRarity> = {
  comum: "common",
  incomum: "uncommon",
  raro: "rare",
  epic: "epic",
  legendary: "legendary",
}

export default async function InventoryPage({ params }: Params) {
  const { rpgId, characterId } = await params
  const staticCharacter = players.find(
    (character) =>
      character.id === characterId && String(character.meta.version) === rpgId,
  )

  if (staticCharacter) {
    const resolvedInventory = staticCharacter.inventory
      .map((entry) => items.find((item) => item.id === entry))
      .filter((item): item is (typeof items)[number] => Boolean(item))
    const cardItems: InventoryCardItem[] = resolvedInventory.map((item) => ({
      id: item.id,
      title: item.name,
      rarityLabel: item.rarity,
      rarityClass: staticRarityClassMap[item.rarity] ?? "common",
      quantity: item.quantity,
      description: item.description,
      ability: item.ability,
    }))

    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Inventario</p>
            <h1 className={styles.title}>{staticCharacter.identity.name}</h1>
          </div>
          <Link href={`/rpg/${rpgId}/characters/${characterId}`} className={styles.backLink}>
            Voltar para ficha
          </Link>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Itens do Personagem</h2>
          <InventoryCards
            items={cardItems}
            emptyMessage="Nenhum item no inventario."
          />
        </div>
      </div>
    )
  }

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
