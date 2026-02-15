"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
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

type BaseItem = {
  id: string
  name: string
  type: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}

type InventoryPayload = {
  inventory?: InventoryItem[]
  isOwner?: boolean
  message?: string
}

type BaseItemsPayload = {
  items?: BaseItem[]
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
  const [baseItems, setBaseItems] = useState<BaseItem[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [success, setSuccess] = useState("")

  const hasInventory = inventory.length > 0

  const selectedItem = useMemo(
    () => baseItems.find((item) => item.id === selectedItemId) ?? null,
    [baseItems, selectedItemId],
  )

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
      setIsOwner(Boolean(payload.isOwner))
    } catch {
      setError("Erro de conexao ao carregar inventario.")
      setInventory([])
    } finally {
      setLoading(false)
    }
  }, [characterId, rpgId])

  const loadBaseItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/rpg/${rpgId}/items`)
      const payload = (await response.json()) as BaseItemsPayload

      if (!response.ok) {
        setFormError(payload.message ?? "Nao foi possivel carregar os itens do RPG.")
        setBaseItems([])
        return
      }

      const items = payload.items ?? []
      setBaseItems(items)
      if (items.length > 0) {
        setSelectedItemId(items[0].id)
      }
    } catch {
      setFormError("Erro de conexao ao carregar itens do RPG.")
      setBaseItems([])
    }
  }, [rpgId])

  useEffect(() => {
    void loadInventory()
  }, [loadInventory])

  useEffect(() => {
    if (isOwner) {
      void loadBaseItems()
    }
  }, [isOwner, loadBaseItems])

  async function handleGiveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError("")
    setSuccess("")

    try {
      const response = await fetch(
        `/api/rpg/${rpgId}/characters/${characterId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseItemId: selectedItemId,
            quantity,
          }),
        },
      )

      const payload = (await response.json()) as InventoryPayload
      if (!response.ok) {
        setFormError(payload.message ?? "Nao foi possivel dar o item.")
        return
      }

      setInventory(payload.inventory ?? [])
      setSuccess("Item adicionado ao inventario do player.")
    } catch {
      setFormError("Erro de conexao ao adicionar item.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Itens do Personagem</h2>

        {isOwner ? (
          <form className={styles.formCard} onSubmit={handleGiveItem}>
            <h3>Dar item para player</h3>

            <label className={styles.field}>
              <span>Item base</span>
              <select
                value={selectedItemId}
                onChange={(event) => setSelectedItemId(event.target.value)}
                disabled={baseItems.length === 0 || saving}
                required
              >
                {baseItems.length === 0 ? (
                  <option value="">Nenhum item cadastrado</option>
                ) : (
                  baseItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.type})
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className={styles.field}>
              <span>Quantidade</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                required
              />
            </label>

            {selectedItem ? (
              <p className={styles.formHelp}>
                Raridade do item: {rarityLabel[selectedItem.rarity]}
              </p>
            ) : null}

            {formError ? <p className={styles.error}>{formError}</p> : null}
            {success ? <p className={styles.success}>{success}</p> : null}

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving || baseItems.length === 0}
            >
              {saving ? "Adicionando..." : "Dar item"}
            </button>
          </form>
        ) : null}

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
