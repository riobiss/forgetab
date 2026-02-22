"use client"

import Link from "next/link"
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Funnel,
  FunnelX,
  Gift,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import styles from "./page.module.css"
import { baseItemTypeValues } from "@/lib/validators/baseItem"
import { IconButton } from "@/components/button"
import { NativeSelectField } from "@/components/select/NativeSelectField"

type ItemType = (typeof baseItemTypeValues)[number]

type BaseItem = {
  id: string
  rpgId: string
  name: string
  image: string | null
  preRequirement: string | null
  type: ItemType
  rarity: string
  damage: string | null
  range: string | null
  ability: string | null
  abilityName: string | null
  effect: string | null
  effectName: string | null
  abilities: unknown
  effects: unknown
  weight: number | null
  duration: string | null
  durability: number | null
  createdAt: string
  updatedAt: string
}

type ApiListPayload = {
  items?: BaseItem[]
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
}

export default function ItemsPage() {
  const params = useParams<{ rpgId: string }>()
  const rpgId = params.rpgId

  const [items, setItems] = useState<BaseItem[]>([])
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ItemType | "all">("all")
  const [showCategories, setShowCategories] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [giveModalItemId, setGiveModalItemId] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState("")
  const [giveQuantity, setGiveQuantity] = useState(1)
  const [giving, setGiving] = useState(false)
  const [giveError, setGiveError] = useState("")
  const [giveSuccess, setGiveSuccess] = useState("")
  const deletingRef = useRef(false)
  const givingRef = useRef(false)

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
        item.rarity.toLowerCase().includes(normalizedSearch) ||
        (item.preRequirement ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.ability ?? "").toLowerCase().includes(normalizedSearch) ||
        (item.abilityName ?? "").toLowerCase().includes(normalizedSearch)
      )
    })
  }, [items, search, selectedCategory])

  const selectedGiveItem = useMemo(
    () => items.find((item) => item.id === giveModalItemId) ?? null,
    [items, giveModalItemId],
  )

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

  const loadCharacters = useCallback(async () => {
    try {
      const response = await fetch(`/api/rpg/${rpgId}/characters`)
      const payload = (await response.json()) as ApiCharactersPayload

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel carregar personagens.")
        setCharacters([])
        return
      }

      setCharacters(payload.characters ?? [])
    } catch {
      setLoadingError("Erro de conexao ao carregar personagens.")
      setCharacters([])
    }
  }, [rpgId])

  useEffect(() => {
    if (rpgId) {
      void loadItems()
      void loadCharacters()
    }
  }, [loadCharacters, loadItems, rpgId])

  function openGiveModal(itemId: string) {
    setGiveModalItemId(itemId)
    setSelectedCharacterId(characters[0]?.id ?? "")
    setGiveQuantity(1)
    setGiveError("")
    setGiveSuccess("")
  }

  function closeGiveModal() {
    setGiveModalItemId(null)
    setGiveError("")
    setGiveSuccess("")
    setGiveQuantity(1)
  }

  async function handleDelete(itemId: string) {
    if (deletingRef.current) return
    const confirmed = window.confirm("Tem certeza que deseja deletar este item?")
    if (!confirmed) {
      return
    }

    try {
      deletingRef.current = true
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
      deletingRef.current = false
    }
  }

  async function handleGiveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (givingRef.current) return
    givingRef.current = true
    setGiving(true)
    setGiveError("")
    setGiveSuccess("")

    if (!selectedGiveItem || !selectedCharacterId) {
      setGiveError("Selecione um personagem para receber o item.")
      setGiving(false)
      givingRef.current = false
      return
    }

    try {
      const response = await fetch(`/api/rpg/${rpgId}/items/give`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseItemId: selectedGiveItem.id,
          quantity: giveQuantity,
          characterIds: [selectedCharacterId],
        }),
      })

      const payload = (await response.json()) as ApiGivePayload

      if (!response.ok) {
        setGiveError(payload.message ?? "Nao foi possivel entregar o item.")
        return
      }

      setGiveSuccess(payload.message ?? "Item entregue com sucesso.")
      setTimeout(() => closeGiveModal(), 700)
    } catch {
      setGiveError("Erro de conexao ao entregar item.")
    } finally {
      setGiving(false)
      givingRef.current = false
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Sessao avancada</p>
          <h1 className={styles.title}>Itens do RPG</h1>
          <p className={styles.subtitle}>
            Gerencie itens e entregue para personagens com quantidade.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/rpg/${rpgId}/items/new`} className={styles.primaryButton}>
            <Plus size={16} />
            <span>Criar item</span>
          </Link>
          <Link href={`/rpg/${rpgId}/edit`} className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Voltar para edicao</span>
          </Link>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionTopbar}>
          <h2 className={styles.sectionTitle}>Listagem de itens</h2>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setShowCategories((prev) => !prev)}
          >
            {showCategories ? (
              <>
                <FunnelX size={16} />
                <span>Ocultar categorias</span>
              </>
            ) : (
              <>
                <Funnel size={16} />
                <span>Mostrar categorias</span>
              </>
            )}
          </button>
        </div>

        <div className={styles.filters}>
          <label className={styles.searchField}>
            <span>Buscar item</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, tipo, raridade ou habilidade"
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
                {(() => {
                  const abilities = parseNamedDescriptionList(item.abilities)
                  const effects = parseNamedDescriptionList(item.effects)
                  const hasLegacyAbility = item.ability || item.abilityName
                  const hasLegacyEffect = item.effect || item.effectName

                  return (
                    <>
                {item.image ? (
                  <div className={styles.cardImageFrame}>
                    <img src={item.image} alt={`Imagem de ${item.name}`} className={styles.cardImage} />
                  </div>
                ) : null}
                <div className={styles.cardHeader}>
                  <h3>{item.name}</h3>
                  <span>{item.type}</span>
                </div>

                <p className={styles.rarityLine}>Raridade: {item.rarity}</p>
                {item.damage !== null ? (
                  <p className={styles.metaLine}>Dano: {item.damage}</p>
                ) : null}
                {item.range !== null ? (
                  <p className={styles.metaLine}>Alcance: {item.range}</p>
                ) : null}
                {item.weight !== null ? (
                  <p className={styles.metaLine}>Peso: {item.weight}</p>
                ) : null}
                {item.durability !== null ? (
                  <p className={styles.metaLine}>Durabilidade: {item.durability}</p>
                ) : null}
                {item.duration !== null ? (
                  <p className={styles.metaLine}>Duracao: {item.duration}</p>
                ) : null}
                {item.preRequirement !== null ? (
                  <p className={styles.metaLine}>Pre-Requisito: {item.preRequirement}</p>
                ) : null}
                {abilities.length > 0
                  ? abilities.map((ability, index) => (
                      <p key={`${item.id}-ability-${index}`} className={styles.metaLine}>
                        Habilidade ({ability.name}): {ability.description}
                      </p>
                    ))
                  : null}
                {effects.length > 0
                  ? effects.map((effect, index) => (
                      <p key={`${item.id}-effect-${index}`} className={styles.metaLine}>
                        Efeito ({effect.name}): {effect.description}
                      </p>
                    ))
                  : null}
                {abilities.length === 0 && hasLegacyAbility ? (
                  <p className={styles.metaLine}>
                    Habilidade ({item.abilityName ?? "sem nome"}): {item.ability ?? "-"}
                  </p>
                ) : null}
                {effects.length === 0 && hasLegacyEffect ? (
                  <p className={styles.metaLine}>
                    Efeito ({item.effectName ?? "sem nome"}): {item.effect ?? "-"}
                  </p>
                ) : null}

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => openGiveModal(item.id)}
                  >
                    <Gift size={16} />
                    <span>Entregar</span>
                  </button>
                  <Link
                    href={`/rpg/${rpgId}/items/${item.id}/edit`}
                    className={styles.ghostButton}
                  >
                    <Pencil size={16} />
                    <span>Editar</span>
                  </Link>
                  <IconButton
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingItemId === item.id}
                    icon={<Trash2 size={16} />}
                    loading={deletingItemId === item.id}
                    loadingIcon={<LoaderCircle size={16} className={styles.iconSpin} />}
                  >
                    {deletingItemId === item.id ? "Deletando..." : "Deletar"}
                  </IconButton>
                </div>
                    </>
                  )
                })()}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {selectedGiveItem ? (
        <div className={styles.modalOverlay} onClick={closeGiveModal}>
          <form
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleGiveItem}
          >
            <h3>Entregar item</h3>
            <p className={styles.modalDescription}>
              Item: <strong>{selectedGiveItem.name}</strong>
            </p>

            <label className={styles.field}>
              <span>Personagem</span>
              <NativeSelectField
                value={selectedCharacterId}
                onChange={(event) => setSelectedCharacterId(event.target.value)}
                required
              >
                {characters.length === 0 ? (
                  <option value="">Nenhum personagem encontrado</option>
                ) : (
                  characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name} ({character.characterType})
                    </option>
                  ))
                )}
              </NativeSelectField>
            </label>

            <label className={styles.field}>
              <span>Quantidade</span>
              <input
                type="number"
                onWheel={(event) => event.currentTarget.blur()}
                min={1}
                value={giveQuantity}
                onChange={(event) => setGiveQuantity(Number(event.target.value))}
                required
              />
            </label>

            {giveError ? <p className={styles.error}>{giveError}</p> : null}
            {giveSuccess ? <p className={styles.feedback}>{giveSuccess}</p> : null}

            <div className={styles.formActions}>
              <IconButton
                className={styles.primaryButton}
                type="submit"
                disabled={giving || !selectedCharacterId || characters.length === 0}
                icon={<Check size={16} />}
                loading={giving}
                loadingIcon={<LoaderCircle size={16} className={styles.iconSpin} />}
              >
                {giving ? "Entregando..." : "Confirmar entrega"}
              </IconButton>
              <IconButton
                type="button"
                className={styles.ghostButton}
                onClick={closeGiveModal}
                icon={<X size={16} />}
              >
                Cancelar
              </IconButton>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}

