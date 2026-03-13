"use client"

import Link from "next/link"
import {
  Check,
  Filter,
  Gift,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react"
import styles from "./ItemsDashboardClient.module.css"
import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import { IconButton } from "@/components/button"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import { ItemUpsertModal } from "./ItemUpsertModal"
import { itemRarityLabel, itemTypeLabel } from "./constants"
import { useItemsDashboardState } from "./useItemsDashboardState"

type ItemsDashboardClientProps = {
  rpgId: string
  deps: ItemsDashboardDependencies
}

export default function ItemsDashboardClient({ rpgId, deps }: ItemsDashboardClientProps) {
  const {
    baseItemTypeValues,
    items,
    characters,
    loading,
    loadingError,
    search,
    setSearch,
    searchOpen,
    setSearchOpen,
    selectedCategory,
    setSelectedCategory,
    selectedRarity,
    setSelectedRarity,
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
    editorOpen,
    editorMode,
    editingItemId,
    editorTab,
    setEditorTab,
    editorLoading,
    editorSaving,
    editorError,
    name,
    setName,
    image,
    description,
    setDescription,
    preRequirement,
    setPreRequirement,
    type,
    setType,
    rarity,
    setRarity,
    damage,
    setDamage,
    range,
    setRange,
    weight,
    setWeight,
    duration,
    setDuration,
    durability,
    setDurability,
    abilities,
    setAbilities,
    effects,
    setEffects,
    customFields,
    setCustomFields,
    customFieldModalOpen,
    setCustomFieldModalOpen,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    baseItemRarityValues,
    uploadingImage,
    uploadError,
    selectedImageFile,
    selectedImagePreviewUrl,
    openCreateModal,
    openEditModal,
    closeEditorModal,
    openGiveModal,
    closeGiveModal,
    handleDelete,
    handleGiveItem,
    handleSaveItem,
    handleImageUpload,
    handleRemoveImage,
    addCustomField,
    updateNamedEntry,
    createEmptyNamedDescription,
  } = useItemsDashboardState({ rpgId, deps })

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Itens</p>
          <h1 className={styles.title}>Itens do RPG</h1>
        </div>
      </div>

      <section className={styles.section}>
        <section className={styles.workspace}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Itens</h2>
              <div className={styles.sidebarTools}>
                <button
                  type="button"
                  className={searchOpen ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                  aria-label="Pesquisar itens"
                  title="Pesquisar itens"
                  onClick={() => setSearchOpen((prev) => !prev)}
                >
                  <Search size={18} />
                </button>
                <button
                  type="button"
                  className={showCategories ? `${styles.iconButton} ${styles.iconButtonActive}` : styles.iconButton}
                  aria-label="Filtrar itens"
                  title="Filtrar itens"
                  onClick={() => setShowCategories((prev) => !prev)}
                >
                  <Filter size={18} />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Criar item"
                  title="Criar item"
                  onClick={openCreateModal}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {searchOpen ? (
              <label className={styles.searchBar}>
                <span>Pesquisar</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, raridade ou habilidade..."
                />
              </label>
            ) : null}

            {loading ? <p className={styles.muted}>Carregando...</p> : null}
            {loadingError ? <p className={styles.error}>{loadingError}</p> : null}

            {visibleItems.map((item) => (
              <div key={item.id} className={styles.skillCard}>
                <strong>{item.name}</strong>
                <small>
                  {new Date(item.updatedAt).getTime() > new Date(item.createdAt).getTime()
                    ? new Date(item.updatedAt).toLocaleString("pt-BR")
                    : new Date(item.createdAt).toLocaleString("pt-BR")}
                </small>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => openGiveModal(item.id)}
                  >
                    <Gift size={16} />
                    <span>Entregar</span>
                  </button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => void openEditModal(item.id)}
                  >
                    <Pencil size={16} />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))}

            {!loading && !loadingError && items.length === 0 ? (
              <p className={styles.muted}>Nenhum item cadastrado para este RPG.</p>
            ) : null}
            {!loading && !loadingError && items.length > 0 && visibleItems.length === 0 ? (
              <p className={styles.muted}>Nenhum item encontrado nos filtros atuais.</p>
            ) : null}
          </aside>

        </section>

        {showCategories ? (
          <>
            <button
              type="button"
              className={styles.drawerBackdrop}
              aria-label="Fechar filtros"
              onClick={() => setShowCategories(false)}
            />
            <aside className={styles.drawer} role="dialog" aria-modal="true">
              <div className={styles.drawerHeader}>
                <h3 className={styles.drawerTitle}>Filtros</h3>
                <button
                  type="button"
                  className={styles.drawerClose}
                  onClick={() => setShowCategories(false)}
                >
                  Fechar
                </button>
              </div>

              <div className={styles.drawerTagsSection}>
                <span className={styles.searchBarLabel}>Categoria</span>
                <div className={styles.chipsRow}>
                  <button
                    type="button"
                    className={
                      selectedCategory === "all"
                        ? `${styles.chipButton} ${styles.chipButtonActive}`
                        : styles.chipButton
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
                          ? `${styles.chipButton} ${styles.chipButtonActive}`
                          : styles.chipButton
                      }
                      onClick={() => setSelectedCategory(category)}
                    >
                      {itemTypeLabel[category]}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.drawerTagsSection}>
                <span className={styles.searchBarLabel}>Raridade</span>
                <div className={styles.chipsRow}>
                  <button
                    type="button"
                    className={
                      selectedRarity === "all"
                        ? `${styles.chipButton} ${styles.chipButtonActive}`
                        : styles.chipButton
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
                          ? `${styles.chipButton} ${styles.chipButtonActive}`
                          : styles.chipButton
                      }
                      onClick={() => setSelectedRarity(rarity)}
                    >
                      {itemRarityLabel[rarity]}
                    </button>
                  ))}
                </div>
              </div>

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
            </aside>
          </>
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

      <ItemUpsertModal
        open={editorOpen}
        mode={editorMode}
        tab={editorTab}
        setTab={setEditorTab}
        loading={editorLoading}
        saving={editorSaving}
        error={editorError}
        uploadError={uploadError}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        preRequirement={preRequirement}
        setPreRequirement={setPreRequirement}
        type={type}
        setType={(value) => setType(value as typeof type)}
        rarity={rarity}
        setRarity={(value) => setRarity(value as typeof rarity)}
        damage={damage}
        setDamage={setDamage}
        range={range}
        setRange={setRange}
        weight={weight}
        setWeight={setWeight}
        duration={duration}
        setDuration={setDuration}
        durability={durability}
        setDurability={setDurability}
        abilities={abilities}
        setAbilities={setAbilities}
        effects={effects}
        setEffects={setEffects}
        customFields={customFields}
        setCustomFields={setCustomFields}
        image={image}
        selectedImageFile={selectedImageFile}
        selectedImagePreviewUrl={selectedImagePreviewUrl}
        uploadingImage={uploadingImage}
        customFieldModalOpen={customFieldModalOpen}
        setCustomFieldModalOpen={setCustomFieldModalOpen}
        newCustomFieldName={newCustomFieldName}
        setNewCustomFieldName={setNewCustomFieldName}
        newCustomFieldValue={newCustomFieldValue}
        setNewCustomFieldValue={setNewCustomFieldValue}
        baseItemTypeValues={baseItemTypeValues}
        baseItemRarityValues={baseItemRarityValues}
        onClose={closeEditorModal}
        onSave={() => void handleSaveItem()}
        onDelete={() => {
          if (editorMode === "edit" && editingItemId) {
            void handleDelete(editingItemId)
          }
        }}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
        onAddCustomField={addCustomField}
        updateNamedEntry={updateNamedEntry}
        createEmptyNamedDescription={createEmptyNamedDescription}
      />
    </main>
  )
}

