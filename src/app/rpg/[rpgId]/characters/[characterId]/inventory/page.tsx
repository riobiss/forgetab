import Link from "next/link"
import { notFound } from "next/navigation"
import players from "@/data/rpg/world-of-clans/entities/player"
import { items } from "@/data/rpg/world-of-clans/items/items"
import styles from "./page.module.css"
import InventoryClient from "./InventoryClient"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

const staticRarityClassMap: Record<string, string> = {
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
      .filter(Boolean)
    const inventoryItemsExist = resolvedInventory.length > 0

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

          {!inventoryItemsExist ? (
            <p className={styles.emptyState}>Nenhum item no inventario.</p>
          ) : (
            <div className={styles.cardGrid}>
              {resolvedInventory.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.card} ${styles[staticRarityClassMap[item.rarity] ?? "common"]}`}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <span>{item.rarity}</span>
                  </div>
                  <p className={styles.cardBodyItalic}>{item.description}</p>
                  {item.ability ? <p>Habilidade: {item.ability}</p> : null}
                  <span>Quantidade: {item.quantity}</span>
                </div>
              ))}
            </div>
          )}
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
