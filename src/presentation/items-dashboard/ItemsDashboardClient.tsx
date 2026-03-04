"use client"

import Link from "next/link"
import Image from "next/image"
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
import styles from "./ItemsDashboardClient.module.css"
import { IconButton } from "@/components/button"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import { useItemsDashboardState } from "./useItemsDashboardState"
import { parseNamedDescriptionList } from "./utils"

type ItemsDashboardClientProps = {
  rpgId: string
}

export default function ItemsDashboardClient({ rpgId }: ItemsDashboardClientProps) {
  const {
    baseItemTypeValues,
    items,
    characters,
    loading,
    loadingError,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    showCategories,
    setShowCategories,
    deletingItemId,
    selectedCharacterId,
    setSelectedCharacterId,
    giveQuantity,
    setGiveQuantity,
    giving,
    giveError,
    giveSuccess,
    visibleItems,
    selectedGiveItem,
    openGiveModal,
    closeGiveModal,
    handleDelete,
    handleGiveItem,
  } = useItemsDashboardState({ rpgId })

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
                    <Image
                      src={item.image}
                      alt={`Imagem de ${item.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 280px"
                      unoptimized
                      className={styles.cardImage}
                    />
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

