"use client"

import { useCallback, useEffect, useState } from "react"
import styles from "./page.module.css"
import InventoryCards from "./components/InventoryCards"
import { InventoryCardItem, InventoryRarity } from "./types"

type InventoryItem = {
  id: string
  rpgId: string
  characterId: string
  baseItemId: string
  quantity: number
  itemName: string
  itemType: string
  itemRarity: InventoryRarity
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
  const cardItems: InventoryCardItem[] = inventory.map((item) => ({
    id: item.id,
    title: item.itemName,
    rarityLabel: rarityLabel[item.itemRarity],
    rarityClass: item.itemRarity,
    quantity: item.quantity,
    secondaryLine: `Tipo: ${item.itemType}`,
  }))

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
        <InventoryCards
          items={cardItems}
          emptyMessage="Nenhum item no inventario."
        />
      ) : null}
    </div>
  )
}
