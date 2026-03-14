"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Pencil, Plus, Search, Star } from "lucide-react"
import type { CharactersDashboardViewModel } from "@/application/charactersDashboard/types"
import CharacterCreationPermission from "./components/CharacterCreationPermission"
import CharacterDetailModal from "./components/CharacterDetailModal"
import NpcMonsterCharacterModal from "./components/NpcMonsterCharacterModal"
import PlayerCharacterModal from "./components/PlayerCharacterModal"
import styles from "./CharactersDashboardPage.module.css"

type CharactersDashboardPageProps = {
  data: CharactersDashboardViewModel
}

export default function CharactersDashboardPage({ data }: CharactersDashboardPageProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [modalState, setModalState] = useState<{
    mode: "create" | "edit"
    characterType: "npc" | "monster"
    characterId?: string | null
  } | null>(null)
  const deferredSearch = useDeferredValue(search)
  const favoriteStorageKey = `characters:favorites:${data.rpgId}`

  const isNpcOrMonsterFilter = data.filterType === "npc" || data.filterType === "monster"
  const canShowCreateButton =
    isNpcOrMonsterFilter ? data.canCreateCharacter && data.canManageNpcMonster : data.canCreateCharacter
  const modal = searchParams.get("modal")
  const editor = searchParams.get("editor")
  const viewer = searchParams.get("viewer")
  const editCharacterId = searchParams.get("characterId") ?? undefined

  const createPlayerHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("modal", "create")
    params.set("editor", "player")
    params.delete("characterId")
    return `${pathname}?${params.toString()}`
  }, [pathname, searchParams])

  const closePlayerModal = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("modal")
    params.delete("editor")
    params.delete("characterId")
    const next = params.toString()
    router.push(next ? `${pathname}?${next}` : pathname)
  }

  const openNpcMonsterModal = (next: {
    mode: "create" | "edit"
    characterType: "npc" | "monster"
    characterId?: string | null
  }) => {
    setModalState(next)
  }

  const playerModalOpen = editor === "player" && (modal === "create" || modal === "edit")
  const playerModalCharacterId = modal === "edit" ? editCharacterId : undefined
  const selectedCharacterDetail =
    modal === "view" && viewer === "character" ? data.selectedCharacterDetail : null

  const openCharacterViewerHref = (characterId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("modal", "view")
    params.set("viewer", "character")
    params.set("characterId", characterId)
    params.delete("editor")
    return `${pathname}?${params.toString()}`
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const rawFavorites = window.localStorage.getItem(favoriteStorageKey)
    if (!rawFavorites) {
      setFavoriteIds([])
      return
    }

    try {
      const parsedFavorites = JSON.parse(rawFavorites)
      setFavoriteIds(Array.isArray(parsedFavorites) ? parsedFavorites.filter(Boolean) : [])
    } catch {
      setFavoriteIds([])
    }
  }, [favoriteStorageKey])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteIds))
  }, [favoriteIds, favoriteStorageKey])

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const toggleFavorite = (characterId: string) => {
    setFavoriteIds((current) =>
      current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId],
    )
  }

  const visibleCharacters = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()
    const filteredByFavorites = favoritesOnly
      ? data.characters.filter((character) => favoriteIdSet.has(character.id))
      : data.characters

    if (!normalizedSearch) {
      return filteredByFavorites
    }

    return filteredByFavorites.filter((character) =>
      character.name.trim().toLowerCase().includes(normalizedSearch),
    )
  }, [data.characters, deferredSearch, favoriteIdSet, favoritesOnly])

  const visibleCounts = visibleCharacters.reduce(
    (acc, character) => {
      acc.all += 1
      acc[character.characterType] += 1
      return acc
    },
    { all: 0, player: 0, npc: 0, monster: 0 },
  )

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.topbar}>
          <div className={styles.titleRow}>
            <div className={styles.titleBlock}>
              <p className={styles.kicker}>{data.rpgName}</p>
              <h1 className={styles.title}>Personagens</h1>
            </div>
            <div className={styles.titleActions}>
              <button
                type="button"
                className={`${styles.iconButton} ${favoritesOnly ? styles.iconButtonActive : ""}`}
                onClick={() => setFavoritesOnly((current) => !current)}
                aria-label={favoritesOnly ? "Mostrar todos os personagens" : "Mostrar apenas favoritos"}
                title={favoritesOnly ? "Mostrar todos os personagens" : "Mostrar apenas favoritos"}
              >
                <Star size={18} fill={favoritesOnly ? "currentColor" : "none"} />
              </button>
              {canShowCreateButton ? (
                isNpcOrMonsterFilter ? (
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.createButton}`}
                    onClick={() =>
                      setModalState({
                        mode: "create",
                        characterType: data.filterType === "monster" ? "monster" : "npc",
                      })
                    }
                    aria-label="Criar personagem"
                    title="Criar personagem"
                  >
                    <Plus size={18} />
                  </button>
                ) : (
                  <Link
                    href={createPlayerHref}
                    className={`${styles.iconButton} ${styles.createButton}`}
                    aria-label="Criar personagem"
                    title="Criar personagem"
                  >
                    <Plus size={18} />
                  </Link>
                )
              ) : null}
            </div>
          </div>
        </div>
        <div className={styles.searchActionsRow}>
          <div className={styles.searchActionsInner}>
            <label className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar personagem"
                aria-label="Buscar personagem"
              />
            </label>
          </div>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.filters}>
          <Link
            href={`/rpg/${data.rpgId}/characters`}
            className={`${styles.filterButton} ${data.filterType === "all" ? styles.filterActive : ""}`}
          >
            Todos
          </Link>
          <Link
            href={`/rpg/${data.rpgId}/characters?type=player`}
            className={`${styles.filterButton} ${data.filterType === "player" ? styles.filterActive : ""}`}
          >
            Player
          </Link>
          <Link
            href={`/rpg/${data.rpgId}/characters?type=npc`}
            className={`${styles.filterButton} ${data.filterType === "npc" ? styles.filterActive : ""}`}
          >
            NPC
          </Link>
          <Link
            href={`/rpg/${data.rpgId}/characters?type=monster`}
            className={`${styles.filterButton} ${data.filterType === "monster" ? styles.filterActive : ""}`}
          >
            Criatura
          </Link>
        </div>

        <div className={styles.resultsMeta}>
          <span>{visibleCounts.all} resultado{visibleCounts.all === 1 ? "" : "s"}</span>
        </div>
      </section>

      {data.canCreateCharacter ? (
        <CharacterCreationPermission
          createPlayerHref={createPlayerHref}
          isOwner={data.isOwner}
          isAcceptedMember={data.isAcceptedMember}
          ownPlayerCount={data.ownPlayerCount}
          allowMultiplePlayerCharacters={data.allowMultiplePlayerCharacters}
        />
      ) : null}

      {visibleCharacters.length > 0 ? (
        <section className={styles.dbSection}>
          <div className={styles.grid}>
            {visibleCharacters.map((character) => (
              <article key={character.id} className={styles.card}>
                <button
                  type="button"
                  className={`${styles.favoriteFab} ${favoriteIdSet.has(character.id) ? styles.favoriteFabActive : ""}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    toggleFavorite(character.id)
                  }}
                  aria-label={
                    favoriteIdSet.has(character.id)
                      ? `Remover ${character.name} dos favoritos`
                      : `Adicionar ${character.name} aos favoritos`
                  }
                  title={
                    favoriteIdSet.has(character.id)
                      ? `Remover ${character.name} dos favoritos`
                      : `Adicionar ${character.name} aos favoritos`
                  }
                >
                  <Star size={16} fill={favoriteIdSet.has(character.id) ? "currentColor" : "none"} />
                </button>
                {data.canManageNpcMonster ? (
                  character.characterType === "npc" || character.characterType === "monster" ? (
                    <button
                      type="button"
                      className={styles.editFab}
                      onClick={() =>
                        openNpcMonsterModal({
                          mode: "edit",
                          characterType:
                            character.characterType === "monster" ? "monster" : "npc",
                          characterId: character.id,
                        })
                      }
                      aria-label={`Editar ${character.name}`}
                      title={`Editar ${character.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                  ) : (
                    <Link
                      href={`${pathname}?${(() => {
                        const params = new URLSearchParams(searchParams.toString())
                        params.set("modal", "edit")
                        params.set("editor", "player")
                        params.set("characterId", character.id)
                        return params.toString()
                      })()}`}
                      className={styles.editFab}
                      aria-label={`Editar ${character.name}`}
                      title={`Editar ${character.name}`}
                    >
                      <Pencil size={16} />
                    </Link>
                  )
                ) : null}
                <Link
                  className={styles.cardLink}
                  href={
                    character.characterType === "player"
                      ? `/rpg/${data.rpgId}/characters/${character.id}`
                      : openCharacterViewerHref(character.id)
                  }
                >
                  {character.image ? (
                    <Image
                      src={character.image}
                      alt={`Imagem do personagem ${character.name}`}
                      fill
                      className={styles.image}
                      priority
                      sizes="(max-width: 1099px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={styles.imageFallback} aria-hidden="true" />
                  )}
                  <div className={styles.overlay}>
                    <h2 className={styles.name}>{character.name}</h2>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {visibleCharacters.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>Nenhum personagem encontrado</h2>
          <p>Troque o filtro atual ou crie um novo personagem para começar a preencher este catalogo.</p>
        </section>
      ) : null}

      {modalState ? (
        <NpcMonsterCharacterModal
          rpgId={data.rpgId}
          isOpen
          mode={modalState.mode}
          characterType={modalState.characterType}
          characterId={modalState.characterId}
          initialBootstrap={data.editorBootstrap}
          onClose={() => setModalState(null)}
        />
      ) : null}

      {playerModalOpen ? (
        <PlayerCharacterModal
          rpgId={data.rpgId}
          isOpen
          characterId={playerModalCharacterId}
          initialBootstrap={data.editorBootstrap}
          onClose={closePlayerModal}
        />
      ) : null}

      {selectedCharacterDetail &&
      (selectedCharacterDetail.characterType === "npc" ||
        selectedCharacterDetail.characterType === "monster") ? (
        <CharacterDetailModal
          data={selectedCharacterDetail}
          onEditNpcMonster={({ characterId, characterType }) => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete("modal")
            params.delete("viewer")
            params.delete("characterId")
            const next = params.toString()
            router.push(next ? `${pathname}?${next}` : pathname)
            setModalState({
              mode: "edit",
              characterId,
              characterType,
            })
          }}
        />
      ) : null}
    </main>
  )
}
