"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Filter } from "lucide-react"
import type { CharacterInventoryDependencies } from "@/application/characterInventory/contracts/CharacterInventoryDependencies"
import type { CharacterInventoryItemDto, CharacterInventoryRarityDto } from "@/application/characterInventory/types"
import {
  loadCharacterInventoryUseCase,
  removeCharacterInventoryItemUseCase,
} from "@/application/characterInventory/use-cases/characterInventory"
import styles from "./CharacterInventoryPage.module.css"
import InventoryCards from "./components/InventoryCards"
import { InventoryCardItem } from "./types"
import { baseItemRarityValues, baseItemTypeValues } from "@/lib/validators/baseItem"
import { itemRarityLabel, itemTypeLabel } from "@/shared/items/itemLabels"
import {
  matchesInventorySearch,
  toInventoryCardItem,
} from "./utils"

type Props = {
  rpgId: string
  characterId: string
  deps: CharacterInventoryDependencies
}

export default function CharacterInventoryClient({ rpgId, characterId, deps }: Props) {
  const [inventory, setInventory] = useState<CharacterInventoryItemDto[]>([])
  const [characterName, setCharacterName] = useState("Personagem")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof baseItemTypeValues)[number] | "all"
  >("all")
  const [selectedRarity, setSelectedRarity] = useState<CharacterInventoryRarityDto | "all">("all")
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false)
  const [useInventoryWeightLimit, setUseInventoryWeightLimit] = useState(false)
  const [maxCarryWeight, setMaxCarryWeight] = useState<number | null>(null)

  const hasInventory = inventory.length > 0
  const totalWeight = useMemo(
    () =>
      inventory.reduce(
        (acc, item) => acc + (item.itemWeight !== null ? item.itemWeight * item.quantity : 0),
        0,
      ),
    [inventory],
  )
  const isOverWeight =
    useInventoryWeightLimit && maxCarryWeight !== null && totalWeight > maxCarryWeight
  const activeExtraFilters =
    (selectedCategory === "all" ? 0 : 1) + (selectedRarity === "all" ? 0 : 1)
  const filteredInventory = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return inventory.filter((item) => {
      const itemTypeNormalized = item.itemType.toLowerCase()
      const matchesCategory =
        selectedCategory === "all" ? true : itemTypeNormalized === selectedCategory
      const matchesRarity =
        selectedRarity === "all" ? true : item.itemRarity === selectedRarity
      if (!matchesCategory || !matchesRarity) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return matchesInventorySearch(item, normalizedSearch)
    })
  }, [inventory, search, selectedCategory, selectedRarity])

  const cardItems: InventoryCardItem[] = filteredInventory.map((item) =>
    toInventoryCardItem(item),
  )

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const payload = await loadCharacterInventoryUseCase(deps, { rpgId, characterId })
      setCharacterName(payload.characterName)
      setInventory(payload.inventory)
      setUseInventoryWeightLimit(payload.useInventoryWeightLimit)
      setMaxCarryWeight(payload.maxCarryWeight)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro de conexao ao carregar inventario.")
      setCharacterName("Personagem")
      setInventory([])
      setUseInventoryWeightLimit(false)
      setMaxCarryWeight(null)
    } finally {
      setLoading(false)
    }
  }, [characterId, deps, rpgId])

  const handleRemoveItem = useCallback(
    async (inventoryItemId: string, quantity: number) => {
      try {
        setRemovingItemId(inventoryItemId)
        setError("")

        const payload = await removeCharacterInventoryItemUseCase(deps, {
          rpgId,
          characterId,
          inventoryItemId,
          quantity,
        })
        const remaining = payload.remainingQuantity
        setInventory((prev) => {
          if (remaining <= 0) {
            return prev.filter((item) => item.id !== inventoryItemId)
          }

          return prev.map((item) =>
            item.id === inventoryItemId ? { ...item, quantity: remaining } : item,
          )
        })
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Erro de conexao ao remover item do inventario.",
        )
      } finally {
        setRemovingItemId(null)
      }
    },
    [characterId, deps, rpgId],
  )

  useEffect(() => {
    void loadInventory()
  }, [loadInventory])

  return (
    <>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Inventario</p>
          <h1 className={styles.title}>
            <Link
              href={`/rpg/${rpgId}/characters/${characterId}`}
              className={styles.titleLink}
            >
              {characterName}
            </Link>
          </h1>
        </div>
        <div className={styles.badge}>
          {useInventoryWeightLimit
            ? `${totalWeight.toFixed(1)} / ${maxCarryWeight?.toFixed(1) ?? "0.0"} kg`
            : `${inventory.length} itens`}
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.filters}>
          <div className={styles.filtersTopRow}>
            <label className={`${styles.filterField} ${styles.filterFieldSearch}`}>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
              />
            </label>
            <button
              type="button"
              className={styles.filtersIconButton}
              onClick={() => setIsFiltersDrawerOpen(true)}
              aria-label="Abrir filtros"
              aria-haspopup="dialog"
              aria-expanded={isFiltersDrawerOpen}
              aria-controls="inventory-filters-drawer"
              title="Filtros"
            >
              <Filter size={18} aria-hidden="true" />
              {activeExtraFilters > 0 ? (
                <span className={styles.filtersCount}>{activeExtraFilters}</span>
              ) : null}
            </button>
          </div>
        </div>

        {isFiltersDrawerOpen ? (
          <>
            <button
              type="button"
              className={styles.drawerBackdrop}
              aria-label="Fechar filtros"
              onClick={() => setIsFiltersDrawerOpen(false)}
            />
            <aside id="inventory-filters-drawer" className={styles.drawer} role="dialog" aria-modal="true">
              <div className={styles.drawerHeader}>
                <h3 className={styles.drawerTitle}>Filtros</h3>
                <button
                  type="button"
                  className={styles.drawerClose}
                  onClick={() => setIsFiltersDrawerOpen(false)}
                  aria-label="Fechar"
                >
                  Fechar
                </button>
              </div>

              <div className={styles.drawerTagsSection}>
                <span className={styles.typesLabel}>Categoria</span>
                <div className={styles.typeChips}>
                  <button
                    type="button"
                    className={
                      selectedCategory === "all"
                        ? `${styles.typeChip} ${styles.typeChipActive}`
                        : styles.typeChip
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
                          ? `${styles.typeChip} ${styles.typeChipActive}`
                          : styles.typeChip
                      }
                      onClick={() => setSelectedCategory(category)}
                    >
                      {itemTypeLabel[category]}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.drawerTagsSection}>
                <span className={styles.typesLabel}>Raridade</span>
                <div className={styles.typeChips}>
                  <button
                    type="button"
                    className={
                      selectedRarity === "all"
                        ? `${styles.typeChip} ${styles.typeChipActive}`
                        : styles.typeChip
                    }
                    onClick={() => setSelectedRarity("all")}
                  >
                    Todas
                  </button>
                  {baseItemRarityValues.map((rarity) => (
                    <button
                      key={rarity}
                      type="button"
                      className={
                        selectedRarity === rarity
                          ? `${styles.typeChip} ${styles.typeChipActive}`
                          : styles.typeChip
                      }
                      onClick={() => setSelectedRarity(rarity)}
                    >
                      {itemRarityLabel[rarity]}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.drawerFooter}>
                <button
                  type="button"
                  className={styles.drawerClear}
                  onClick={() => {
                    setSelectedCategory("all")
                    setSelectedRarity("all")
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            </aside>
          </>
        ) : null}

        {loading ? <p className={styles.emptyState}>Carregando items...</p> : null}
        {error ? <p className={styles.errorText}>{error}</p> : null}

        {!loading && !error && !hasInventory ? (
          <p className={styles.emptyState}>Nenhum item.</p>
        ) : null}
        {!loading && !error && hasInventory && cardItems.length === 0 ? (
          <p className={styles.emptyState}>Nenhum item encontrado com os filtros atuais.</p>
        ) : null}

        {!loading && !error && hasInventory && cardItems.length > 0 ? (
          <InventoryCards
            items={cardItems}
            emptyMessage="Nenhum item."
            onRemoveItem={handleRemoveItem}
            removingItemId={removingItemId}
          />
        ) : null}
      </section>
    </>
  )
}
