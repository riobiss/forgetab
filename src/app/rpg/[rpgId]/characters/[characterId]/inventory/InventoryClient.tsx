"use client"

import { useCallback, useEffect, useState } from "react"
import styles from "./page.module.css"

type InventoryItem = {
  id: string
  rpgId: string
  characterId: string
  baseItemId: string
  quantity: number
  itemName: string
  itemType: string
  itemRarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}

type InventoryPayload = {
  inventory?: InventoryItem[]
  message?: string
}

type Props = {
  rpgId: string
  characterId: string
}

const rarityLabel: Record<InventoryItem["itemRarity"], string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Epico",
  legendary: "Lendario",
}

export default function InventoryClient({ rpgId, characterId }: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const hasInventory = inventory.length > 0

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `/api/rpg/${rpgId}/characters/${characterId}/inventory`,
      )
      const payload = (await response.json()) as InventoryPayload

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel carregar o inventario.")
        setInventory([])
        return
      }

      setInventory(payload.inventory ?? [])
    } catch {
      setError("Erro de conexao ao carregar inventario.")
      setInventory([])
    } finally {
      setLoading(false)
    }
  }, [characterId, rpgId])

  useEffect(() => {
    void loadInventory()
  }, [loadInventory])

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Itens do Personagem</h2>

        {loading ? <p className={styles.emptyState}>Carregando inventario...</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error && !hasInventory ? (
          <p className={styles.emptyState}>Nenhum item no inventario.</p>
        ) : null}

        {!loading && !error && hasInventory ? (
          <div className={styles.cardGrid}>
            {inventory.map((item) => (
              <div
                key={item.id}
                className={`${styles.card} ${styles[item.itemRarity]}`}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{item.itemName}</h3>
                  <span>{rarityLabel[item.itemRarity]}</span>
                </div>

                <p className={styles.cardBodyItalic}>Tipo: {item.itemType}</p>
                <span>Quantidade: {item.quantity}</span>
              </div>
            ))}
          </div>
        ) : null}
    </div>
  )
}
