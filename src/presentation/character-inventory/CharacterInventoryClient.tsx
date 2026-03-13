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
import { itemRarityLabel, itemTypeLabel } from "@/presentation/items-dashboard/constants"

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
      if (!description) {
        return null
      }

        return { name, description }
      })
      .filter((entry): entry is { name: string; description: string } => entry !== null)
  }

  function parseCustomFieldList(value: unknown) {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null
        }

        const maybeName = (entry as { name?: unknown }).name
        const maybeValue = (entry as { value?: unknown }).value
        if (typeof maybeName !== "string") {
          return null
        }

        const name = maybeName.trim()
        if (!name) {
          return null
        }

        return {
          name,
          value: typeof maybeValue === "string" ? maybeValue.trim() : "",
        }
      })
      .filter((entry): entry is { name: string; value: string } => entry !== null)
  }

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

      const abilities = parseNamedDescriptionList(item.itemAbilities)
      const effects = parseNamedDescriptionList(item.itemEffects)

      return (
        item.itemName.toLowerCase().includes(normalizedSearch) ||
        item.itemType.toLowerCase().includes(normalizedSearch) ||
        item.itemRarity.toLowerCase().includes(normalizedSearch) ||
        (item.itemDescription ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.itemPreRequirement ?? "").toLowerCase().includes(normalizedSearch) ||
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
  }, [inventory, search, selectedCategory, selectedRarity])

  const cardItems: InventoryCardItem[] = filteredInventory.map((item) => {
    const abilities = parseNamedDescriptionList(item.itemAbilities)
    const effects = parseNamedDescriptionList(item.itemEffects)
    const coreStats: Array<{ label: string; value: string }> = []
    const abilityEntries: Array<{ name: string; description: string }> = []
    const effectEntries: Array<{ name: string; description: string }> = []
    const customFields = parseCustomFieldList(item.itemCustomFields)

    if (item.itemDamage) {
      coreStats.push({ label: "Dano", value: item.itemDamage })
    }
    if (item.itemRange) {
      coreStats.push({ label: "Alcance", value: item.itemRange })
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
    if (item.itemPreRequirement) {
      coreStats.push({ label: "Pre-Requisito", value: item.itemPreRequirement })
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
    if (customFields.length > 0) {
      customFields.forEach((field) =>
        coreStats.push({ label: field.name, value: field.value || "-" }),
      )
    }

    return {
      id: item.id,
      title: item.itemName,
      imageUrl: item.itemImage ?? undefined,
      rarityLabel: itemRarityLabel[item.itemRarity],
      rarityClass: item.itemRarity,
      quantity: item.quantity,
      description: item.itemDescription ?? undefined,
      secondaryLine: itemTypeLabel[item.itemType as keyof typeof itemTypeLabel] ?? item.itemType,
      coreStats,
      abilityEntries,
      effectEntries,
    }
  })

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

        {loading ? <p className={styles.emptyState}>Carregando inventario...</p> : null}
        {error ? <p className={styles.errorText}>{error}</p> : null}

        {!loading && !error && !hasInventory ? (
          <p className={styles.emptyState}>Nenhum item no inventario.</p>
        ) : null}
        {!loading && !error && hasInventory && cardItems.length === 0 ? (
          <p className={styles.emptyState}>Nenhum item encontrado com os filtros atuais.</p>
        ) : null}

        {!loading && !error && hasInventory && cardItems.length > 0 ? (
          <InventoryCards
            items={cardItems}
            emptyMessage="Nenhum item no inventario."
            onRemoveItem={handleRemoveItem}
            removingItemId={removingItemId}
          />
        ) : null}
      </section>
    </>
  )
}
