"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import styles from "./page.module.css"
import InventoryCards from "./components/InventoryCards"
import { InventoryCardItem, InventoryRarity } from "./types"
import { baseItemTypeValues } from "@/lib/validators/baseItem"

type InventoryItem = {
  id: string
  rpgId: string
  characterId: string
  baseItemId: string
  quantity: number
  itemName: string
  itemDescription: string | null
  itemType: string
  itemRarity: InventoryRarity
  itemDamage: string | null
  itemAbility: string | null
  itemAbilityName: string | null
  itemEffect: string | null
  itemEffectName: string | null
  itemAbilities: unknown
  itemEffects: unknown
  itemWeight: number | null
  itemDuration: string | null
  itemDurability: number | null
}

type InventoryPayload = {
  inventory?: InventoryItem[]
  message?: string
}

type RemoveInventoryPayload = {
  message?: string
  inventoryItemId?: string
  remainingQuantity?: number
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
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof baseItemTypeValues)[number] | "all"
  >("all")

  function parseNamedDescriptionList(value: unknown) {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null
        }

        const maybeName = (entry as { name?: unknown }).name
        const maybeDescription = (entry as { description?: unknown }).description
        if (typeof maybeName !== "string" || typeof maybeDescription !== "string") {
          return null
        }

        const name = maybeName.trim()
        const description = maybeDescription.trim()
        if (!name || !description) {
          return null
        }

        return { name, description }
      })
      .filter((entry): entry is { name: string; description: string } => entry !== null)
  }

  const hasInventory = inventory.length > 0
  const filteredInventory = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return inventory.filter((item) => {
      const itemTypeNormalized = item.itemType.toLowerCase()
      const matchesCategory =
        selectedCategory === "all" ? true : itemTypeNormalized === selectedCategory
      if (!matchesCategory) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const abilities = parseNamedDescriptionList(item.itemAbilities)
      const effects = parseNamedDescriptionList(item.itemEffects)

      return (
        item.itemName.toLowerCase().includes(normalizedSearch) ||
        item.itemType.toLowerCase().includes(normalizedSearch) ||
        item.itemRarity.toLowerCase().includes(normalizedSearch) ||
        (item.itemDescription ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.itemDamage ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.itemDuration ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.itemAbility ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.itemAbilityName ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.itemEffect ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.itemEffectName ?? "").toLowerCase().includes(normalizedSearch) ||
        abilities.some(
          (ability) =>
            ability.name.toLowerCase().includes(normalizedSearch) ||
            ability.description.toLowerCase().includes(normalizedSearch),
        ) ||
        effects.some(
          (effect) =>
            effect.name.toLowerCase().includes(normalizedSearch) ||
            effect.description.toLowerCase().includes(normalizedSearch),
        )
      )
    })
  }, [inventory, search, selectedCategory])

  const cardItems: InventoryCardItem[] = filteredInventory.map((item) => {
    const abilities = parseNamedDescriptionList(item.itemAbilities)
    const effects = parseNamedDescriptionList(item.itemEffects)
    const metaLines: string[] = []
    const coreStats: Array<{ label: string; value: string }> = []
    const abilityEntries: Array<{ name: string; description: string }> = []
    const effectEntries: Array<{ name: string; description: string }> = []

    if (item.itemDamage) {
      coreStats.push({ label: "Dano", value: item.itemDamage })
    }
    if (item.itemWeight !== null) {
      coreStats.push({ label: "Peso", value: `${item.itemWeight} kg` })
    }
    if (item.itemDuration) {
      coreStats.push({ label: "Duracao", value: item.itemDuration })
    }
    if (item.itemDurability !== null) {
      coreStats.push({ label: "Durabilidade", value: `${item.itemDurability}` })
    }
    if (abilities.length > 0) {
      abilities.forEach((ability) => abilityEntries.push(ability))
    } else if (item.itemAbility || item.itemAbilityName) {
      abilityEntries.push({
        name: item.itemAbilityName ?? "sem nome",
        description: item.itemAbility ?? "-",
      })
    }
    if (effects.length > 0) {
      effects.forEach((effect) => effectEntries.push(effect))
    } else if (item.itemEffect || item.itemEffectName) {
      effectEntries.push({
        name: item.itemEffectName ?? "sem nome",
        description: item.itemEffect ?? "-",
      })
    }

    return {
      id: item.id,
      title: item.itemName,
      rarityLabel: rarityLabel[item.itemRarity],
      rarityClass: item.itemRarity,
      quantity: item.quantity,
      description: item.itemDescription ?? undefined,
      secondaryLine: item.itemType,
      coreStats,
      abilityEntries,
      effectEntries,
      metaLines,
    }
  })

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

  const handleRemoveItem = useCallback(
    async (inventoryItemId: string, quantity: number) => {
      try {
        setRemovingItemId(inventoryItemId)
        setError("")

        const response = await fetch(
          `/api/rpg/${rpgId}/characters/${characterId}/inventory`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inventoryItemId, quantity }),
          },
        )
        const payload = (await response.json()) as RemoveInventoryPayload

        if (!response.ok) {
          setError(payload.message ?? "Nao foi possivel remover item do inventario.")
          return
        }

        const remaining = payload.remainingQuantity ?? 0
        setInventory((prev) => {
          if (remaining <= 0) {
            return prev.filter((item) => item.id !== inventoryItemId)
          }

          return prev.map((item) =>
            item.id === inventoryItemId ? { ...item, quantity: remaining } : item,
          )
        })
      } catch {
        setError("Erro de conexao ao remover item do inventario.")
      } finally {
        setRemovingItemId(null)
      }
    },
    [characterId, rpgId],
  )

  useEffect(() => {
    void loadInventory()
  }, [loadInventory])

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Itens do Personagem</h2>
      <div className={styles.filters}>
        <label className={styles.searchField}>
          <span>Buscar item</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, tipo, raridade, habilidade ou efeito"
          />
        </label>

        <div className={styles.categories}>
          <button
            type="button"
            className={
              selectedCategory === "all"
                ? `${styles.categoryButton} ${styles.categoryButtonActive}`
                : styles.categoryButton
            }
            onClick={() => setSelectedCategory("all")}
          >
            Todas
          </button>
          {baseItemTypeValues.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? `${styles.categoryButton} ${styles.categoryButtonActive}`
                  : styles.categoryButton
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className={styles.emptyState}>Carregando inventario...</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error && !hasInventory ? (
        <p className={styles.emptyState}>Nenhum item no inventario.</p>
      ) : null}
      {!loading && !error && hasInventory && cardItems.length === 0 ? (
        <p className={styles.emptyState}>Nenhum item encontrado nos filtros atuais.</p>
      ) : null}

      {!loading && !error && hasInventory && cardItems.length > 0 ? (
        <InventoryCards
          items={cardItems}
          emptyMessage="Nenhum item no inventario."
          onRemoveItem={handleRemoveItem}
          removingItemId={removingItemId}
        />
      ) : null}
    </div>
  )
}
