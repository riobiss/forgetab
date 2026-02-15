"use client"

import Link from "next/link"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import styles from "./page.module.css"
import {
  baseItemRarityValues,
  baseItemTypeValues,
} from "@/lib/validators/baseItem"

type ItemType = (typeof baseItemTypeValues)[number]
type ItemRarity = (typeof baseItemRarityValues)[number]

type BaseItem = {
  id: string
  rpgId: string
  name: string
  type: ItemType
  rarity: ItemRarity
  createdAt: string
  updatedAt: string
}

type ApiListPayload = {
  items?: BaseItem[]
  message?: string
}

type ApiItemPayload = {
  item?: BaseItem
  message?: string
}

type CharacterSummary = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
}

type ApiCharactersPayload = {
  characters?: CharacterSummary[]
  message?: string
}

type ApiGivePayload = {
  message?: string
  affectedPlayers?: number
}

export default function ItemsPage() {
  const params = useParams<{ rpgId: string }>()
  const rpgId = params.rpgId

  const [items, setItems] = useState<BaseItem[]>([])
  const [players, setPlayers] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<ItemType>("weapon")
  const [rarity, setRarity] = useState<ItemRarity>("common")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ItemType | "all">("all")
  const [showCategories, setShowCategories] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [selectedGiveItemId, setSelectedGiveItemId] = useState("")
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [giveQuantity, setGiveQuantity] = useState(1)
  const [giving, setGiving] = useState(false)
  const [giveError, setGiveError] = useState("")
  const [giveSuccess, setGiveSuccess] = useState("")

  const isEditing = useMemo(() => Boolean(editingItemId), [editingItemId])
  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ? true : item.type === selectedCategory

      if (!matchesCategory) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.type.toLowerCase().includes(normalizedSearch) ||
        item.rarity.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [items, search, selectedCategory])

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingError("")

      const response = await fetch(`/api/rpg/${rpgId}/items`)
      const payload = (await response.json()) as ApiListPayload

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel carregar os itens.")
        setItems([])
        return
      }

      setItems(payload.items ?? [])
    } catch {
      setLoadingError("Erro de conexao ao carregar itens.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [rpgId])

  const loadPlayers = useCallback(async () => {
    try {
      const response = await fetch(`/api/rpg/${rpgId}/characters`)
      const payload = (await response.json()) as ApiCharactersPayload

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel carregar os players.")
        setPlayers([])
        return
      }

      const allCharacters = payload.characters ?? []
      setPlayers(allCharacters.filter((character) => character.characterType === "player"))
    } catch {
      setLoadingError("Erro de conexao ao carregar players.")
      setPlayers([])
    }
  }, [rpgId])

  useEffect(() => {
    if (rpgId) {
      void loadItems()
      void loadPlayers()
    }
  }, [loadItems, loadPlayers, rpgId])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedGiveItemId("")
      return
    }

    const hasSelected = items.some((item) => item.id === selectedGiveItemId)
    if (!hasSelected) {
      setSelectedGiveItemId(items[0].id)
    }
  }, [items, selectedGiveItemId])

  function resetForm() {
    setEditingItemId(null)
    setName("")
    setType("weapon")
    setRarity("common")
    setSubmitError("")
  }

  function openCreateForm() {
    resetForm()
    setIsFormOpen(true)
  }

  function openEditForm(item: BaseItem) {
    setEditingItemId(item.id)
    setName(item.name)
    setType(item.type)
    setRarity(item.rarity)
    setSubmitError("")
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    resetForm()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setSubmitError("")

    try {
      const endpoint = isEditing
        ? `/api/rpg/${rpgId}/items/${editingItemId}`
        : `/api/rpg/${rpgId}/items`

      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          rarity,
        }),
      })

      const payload = (await response.json()) as ApiItemPayload

      if (!response.ok) {
        setSubmitError(payload.message ?? "Nao foi possivel salvar o item.")
        return
      }

      if (!payload.item) {
        setSubmitError("Resposta invalida da API.")
        return
      }

      if (isEditing) {
        setItems((prev) =>
          prev.map((item) => (item.id === payload.item?.id ? payload.item : item)),
        )
      } else {
        setItems((prev) => [payload.item as BaseItem, ...prev])
      }

      closeForm()
    } catch {
      setSubmitError("Erro de conexao ao salvar item.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    const confirmed = window.confirm("Tem certeza que deseja deletar este item?")

    if (!confirmed) {
      return
    }

    try {
      setDeletingItemId(itemId)
      setLoadingError("")

      const response = await fetch(`/api/rpg/${rpgId}/items/${itemId}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel deletar o item.")
        return
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch {
      setLoadingError("Erro de conexao ao deletar item.")
    } finally {
      setDeletingItemId(null)
    }
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId)
      }

      return [...prev, playerId]
    })
  }

  async function handleGiveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGiving(true)
    setGiveError("")
    setGiveSuccess("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/items/give`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseItemId: selectedGiveItemId,
          quantity: giveQuantity,
          characterIds: selectedPlayerIds,
        }),
      })

      const payload = (await response.json()) as ApiGivePayload

      if (!response.ok) {
        setGiveError(payload.message ?? "Nao foi possivel dar o item para os players.")
        return
      }

      setGiveSuccess(payload.message ?? "Item enviado com sucesso.")
      setSelectedPlayerIds([])
      setGiveQuantity(1)
    } catch {
      setGiveError("Erro de conexao ao dar item para os players.")
    } finally {
      setGiving(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Sessao avancada</p>
          <h1 className={styles.title}>Itens do RPG</h1>
          <p className={styles.subtitle}>
            Crie e edite baseitems com nome, tipo e raridade.
          </p>
        </div>
        <Link href={`/rpg/${rpgId}/edit`} className={styles.backLink}>
          Voltar para edicao
        </Link>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionTopbar}>
          <h2 className={styles.sectionTitle}>Baseitems</h2>
          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => setShowCategories((prev) => !prev)}
            >
              {showCategories ? "Ocultar categorias" : "Mostrar categorias"}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={openCreateForm}
            >
              Criar item
            </button>
          </div>
        </div>

        <form className={styles.formCard} onSubmit={handleGiveItem}>
          <h3>Dar item para player(s)</h3>

          <label className={styles.field}>
            <span>Item selecionado</span>
            <select
              value={selectedGiveItemId}
              onChange={(event) => setSelectedGiveItemId(event.target.value)}
              disabled={items.length === 0 || giving}
              required
            >
              {items.length === 0 ? (
                <option value="">Nenhum item cadastrado</option>
              ) : (
                items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.type} - {item.rarity})
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
              value={giveQuantity}
              onChange={(event) => setGiveQuantity(Number(event.target.value))}
              required
            />
          </label>

          <div className={styles.field}>
            <span>Players para receber</span>
            {players.length === 0 ? (
              <p className={styles.feedback}>Nenhum player encontrado neste RPG.</p>
            ) : (
              <div className={styles.playersGrid}>
                {players.map((player) => (
                  <label key={player.id} className={styles.playerOption}>
                    <input
                      type="checkbox"
                      checked={selectedPlayerIds.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                      disabled={giving}
                    />
                    <span>{player.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {giveError ? <p className={styles.error}>{giveError}</p> : null}
          {giveSuccess ? <p className={styles.feedback}>{giveSuccess}</p> : null}

          <div className={styles.formActions}>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={
                giving ||
                items.length === 0 ||
                players.length === 0 ||
                selectedPlayerIds.length === 0
              }
            >
              {giving ? "Enviando..." : "Dar item para players selecionados"}
            </button>
          </div>
        </form>

        <div className={styles.filters}>
          <label className={styles.searchField}>
            <span>Buscar item</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, tipo ou raridade"
            />
          </label>

          {showCategories ? (
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
          ) : null}
        </div>

        {isFormOpen ? (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h3>{isEditing ? "Editar item" : "Novo item"}</h3>

            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Tipo</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ItemType)}
              >
                {baseItemTypeValues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Raridade</span>
              <select
                value={rarity}
                onChange={(event) => setRarity(event.target.value as ItemRarity)}
              >
                {baseItemRarityValues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {submitError ? <p className={styles.error}>{submitError}</p> : null}

            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? "Salvando..." : isEditing ? "Salvar item" : "Criar item"}
              </button>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={closeForm}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {loading ? <p className={styles.feedback}>Carregando itens...</p> : null}
        {loadingError ? <p className={styles.error}>{loadingError}</p> : null}

        {!loading && !loadingError && items.length === 0 ? (
          <p className={styles.feedback}>Nenhum item cadastrado para este RPG.</p>
        ) : null}

        {!loading &&
        !loadingError &&
        items.length > 0 &&
        visibleItems.length === 0 ? (
          <p className={styles.feedback}>Nenhum item encontrado nos filtros atuais.</p>
        ) : null}

        {!loading && !loadingError && visibleItems.length > 0 ? (
          <div className={styles.grid}>
            {visibleItems.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{item.name}</h3>
                  <span>{item.type}</span>
                </div>

                <p className={styles.rarityLine}>Raridade: {item.rarity}</p>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setSelectedGiveItemId(item.id)}
                  >
                    {selectedGiveItemId === item.id ? "Item selecionado" : "Selecionar p/ dar"}
                  </button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => openEditForm(item)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingItemId === item.id}
                  >
                    {deletingItemId === item.id ? "Deletando..." : "Deletar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  )
}
