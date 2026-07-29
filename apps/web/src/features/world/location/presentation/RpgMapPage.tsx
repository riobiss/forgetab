"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { Map as MapIcon, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useRpgMapsCatalog } from "@/features/world/location/presentation/hooks/useRpgMapsCatalog"
import { useRpgMapPageModalFocus } from "@/features/world/location/presentation/hooks/useRpgMapPageModalFocus"
import { useRpgMapSections } from "@/features/world/location/presentation/hooks/useRpgMapSections"
import { usePrivateMarkerOptions } from "@/features/world/location/presentation/hooks/usePrivateMarkerOptions"
import { useRpgMapMarkerLinks } from "@/features/world/location/presentation/hooks/useRpgMapMarkerLinks"
import { MapSectionConflictModal } from "@/features/world/location/presentation/components/MapSectionConflictModal"
import { MapSectionCustomFieldModal } from "@/features/world/location/presentation/components/MapSectionCustomFieldModal"
import { MapFormModal } from "@/features/world/location/presentation/components/MapFormModal"
import { MapSectionFormModal } from "@/features/world/location/presentation/components/MapSectionFormModal"
import { MapSectionDetailsModal } from "@/features/world/location/presentation/components/MapSectionDetailsModal"
import { MapSectionTree } from "@/features/world/location/presentation/components/MapSectionTree"
import { MundiMap } from "@/features/world/location/presentation/WorldMap"
import styles from "./RpgMapPage.module.css"

type RpgMapPageProps = {
  rpgId: string
  rpgTitle: string
  view?: "catalog" | "detail"
  initialMapId?: string | null
  detailTitle?: string | null
}

const SECTION_MARKER_COLORS = [
  "#f97316",
  "#f5b33b",
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#a78bfa",
]

export function RpgMapPage({
  rpgId,
  rpgTitle,
  view = "catalog",
  initialMapId = null,
  detailTitle = null,
}: RpgMapPageProps) {
  const pageContentRef = useRef<HTMLDivElement | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  )
  const [isMapCollapsed, setIsMapCollapsed] = useState(false)
  const {
    closeMapModal,
    deleteMap,
    detail,
    editingMap,
    error,
    filteredMaps,
    isMapModalOpen,
    loadDetail,
    loadMaps,
    loadingDetail,
    loadingMaps,
    mapModalRef,
    mapForm,
    mapFormError,
    maps,
    openCreateMapModal,
    openEditMapModal,
    saveMap,
    saving: mapSaving,
    search,
    selectedMapId,
    setMapForm,
    setSearch,
  } = useRpgMapsCatalog({
    rpgId,
    view,
    initialMapId,
    setSelectedSectionId,
  })
  const privateMarkerOptions = usePrivateMarkerOptions(
    selectedMapId,
    SECTION_MARKER_COLORS,
  )
  const {
    canEditMapContent,
    canManageMapImage,
    canManagePublicMarkers,
    focusMarker,
    focusMarkerRequest,
    linkedSectionSnapshots,
    mapFeatureRef,
    markerLinkSelectOptions,
    markerOptions,
    markerSectionOptions,
  } = useRpgMapMarkerLinks(detail, privateMarkerOptions)

  const {
    breadcrumbs,
    closeConflictModal,
    closeCustomFieldModal,
    closeSectionDetailsModal,
    closeSectionModal,
    customFieldDraft,
    customFieldError,
    customFieldKeyInputRef,
    customFieldModalRef,
    deleteSection,
    editingSection,
    filteredTree,
    handleEscape,
    handleSaveCustomField,
    handleSectionImageChange,
    isCustomFieldModalOpen,
    isSectionDetailsModalOpen,
    isSectionModalOpen,
    linkedSectionMarker,
    openCreateSectionModal,
    openCustomFieldModal,
    openEditSectionModal,
    openSectionDetails,
    openSectionImagePicker,
    parentOptions,
    pendingSectionConflict,
    removeSectionImage,
    resolveSectionConflict,
    saveMarkerSectionLink,
    saveSection,
    saving: sectionSaving,
    sectionConflictModalRef,
    sectionDetailsModalRef,
    sectionForm,
    sectionFormError,
    sectionImageInputRef,
    sectionImageUploading,
    sectionModalRef,
    sectionNameInputId,
    sectionNameInputRef,
    sectionRenderState,
    sectionSearch,
    selectedSection,
    setCustomFieldDraft,
    setSectionForm,
    setSectionSearch,
  } = useRpgMapSections({
    rpgId,
    selectedMapId,
    detail,
    markerOptions,
    selectedSectionId,
    setSelectedSectionId,
    loadDetail,
    loadMaps,
  })

  useRpgMapPageModalFocus({
    backgroundElement: pageContentRef.current,
    isMapModalOpen,
    mapModalElement: mapModalRef.current,
    isSectionModalOpen,
    sectionModalElement: sectionModalRef.current,
    isSectionDetailsModalOpen,
    sectionDetailsModalElement: sectionDetailsModalRef.current,
    isCustomFieldModalOpen,
    customFieldModalElement: customFieldModalRef.current,
    hasPendingSectionConflict: Boolean(pendingSectionConflict),
    sectionConflictModalElement: sectionConflictModalRef.current,
    onEscape: () => {
      if (isMapModalOpen) {
        closeMapModal()
        return
      }

      handleEscape()
    },
  })

  return (
    <div className={styles.page}>
      <div ref={pageContentRef} className={styles.pageContent}>
        <section className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.kicker}>
              {view === "detail" ? "Mapa" : rpgTitle}
            </p>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>
                {view === "detail"
                  ? detailTitle || detail?.map.title || "Mapa"
                  : "Mapa"}
              </h1>
              {view === "catalog" ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={openCreateMapModal}
                >
                  <Plus size={16} />
                  <span>Criar</span>
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {view === "catalog" ? (
          <>
            <section className={styles.controls}>
              <div className={styles.searchRow}>
                <label className={styles.searchField}>
                  <Search size={16} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar mapas..."
                  />
                </label>
              </div>
            </section>

            {loadingMaps ? (
              <section className={styles.groups}>
                <p className={styles.feedback}>Carregando mapas...</p>
              </section>
            ) : null}
            {error && !loadingMaps ? (
              <section className={styles.groups}>
                <p className={styles.error}>{error}</p>
              </section>
            ) : null}

            {!loadingMaps && filteredMaps.length === 0 ? (
              <section className={styles.groups}>
                <div className={styles.emptyPanel}>
                  <p>
                    {maps.length === 0
                      ? "Nenhum mapa cadastrado ainda."
                      : "Nenhum mapa encontrado com a busca atual."}
                  </p>
                </div>
              </section>
            ) : null}

            {filteredMaps.length > 0 ? (
              <section className={styles.groups}>
                <article className={styles.group}>
                  <div className={styles.groupHeaderStatic}>
                    <div className={styles.groupHeaderInfo}>
                      <h2 className={styles.groupTitle}>Mapas</h2>
                      <p className={styles.groupSubtitle}>
                        Escolha um mapa para abrir a visao principal.
                      </p>
                    </div>
                    <span className={styles.groupBadge}>
                      {filteredMaps.length}
                    </span>
                  </div>

                  <div className={styles.groupContent}>
                    <div className={styles.mapList}>
                      {filteredMaps.map((map) => (
                        <article
                          key={map.id}
                          className={`${styles.mapCard} ${selectedMapId === map.id ? styles.mapCardActive : ""}`}
                        >
                          <Link
                            href={`/rpg/${rpgId}/map/${map.id}`}
                            className={styles.mapCardMain}
                          >
                            <div className={styles.mapCardHeader}>
                              <MapIcon size={16} />
                              <strong>{map.title}</strong>
                            </div>
                            <p>{map.description || "Sem descricao."}</p>
                            <small>{map.sectionsCount ?? 0} secoes</small>
                          </Link>
                          <div className={styles.mapCardActions}>
                            {map.canEdit ? (
                              <button
                                type="button"
                                className={styles.iconButton}
                                onClick={() => openEditMapModal(map)}
                              >
                                <Pencil size={14} />
                              </button>
                            ) : null}
                            {map.canDelete ? (
                              <button
                                type="button"
                                className={styles.iconButtonDanger}
                                onClick={() => void deleteMap(map)}
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </article>
              </section>
            ) : null}
          </>
        ) : null}

        {view === "detail" ? (
          <section className={styles.content}>
            {loadingDetail ? (
              <p className={styles.feedback}>Carregando estrutura...</p>
            ) : null}

            {!loadingDetail && detail ? (
              <>
                {canEditMapContent || detail ? (
                  <div className={styles.headerActions}>
                    {canEditMapContent ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => openEditMapModal(detail.map)}
                      >
                        <Pencil size={16} />
                        <span>Editar mapa</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setIsMapCollapsed((current) => !current)}
                    >
                      <span>
                        {isMapCollapsed ? "Expandir mapa" : "Recolher mapa"}
                      </span>
                    </button>
                  </div>
                ) : null}

                {!isMapCollapsed ? (
                  <div ref={mapFeatureRef}>
                    <MundiMap
                      rpgId={rpgId}
                      mapId={detail.map.id}
                      canEditContent={canEditMapContent}
                      canManageImage={canManageMapImage}
                      canManagePublicMarkers={canManagePublicMarkers}
                      initialMapSrc={detail.map.image}
                      initialPublicMarkerGroups={detail.markerGroups}
                      linkedSections={linkedSectionSnapshots}
                      sectionOptions={markerSectionOptions}
                      focusMarkerRequest={focusMarkerRequest}
                      onOpenLinkedSection={openSectionDetails}
                      onSaveMarkerSectionLink={saveMarkerSectionLink}
                    />
                  </div>
                ) : null}

                <MapSectionTree
                  canCreate={canEditMapContent}
                  filteredTree={filteredTree}
                  sectionSearch={sectionSearch}
                  onChangeSearch={setSectionSearch}
                  onCreate={() => openCreateSectionModal(selectedSection)}
                  onSelect={openSectionDetails}
                  onEdit={openEditSectionModal}
                  selectedSectionId={selectedSectionId}
                />
              </>
            ) : null}
          </section>
        ) : null}
      </div>

      <MapFormModal
        isOpen={isMapModalOpen}
        modalRef={mapModalRef}
        editingMap={editingMap}
        mapForm={mapForm}
        mapFormError={mapFormError}
        saving={mapSaving}
        onChangeForm={setMapForm}
        onSave={() => void saveMap()}
        onClose={closeMapModal}
      />

      <MapSectionDetailsModal
        isOpen={isSectionDetailsModalOpen}
        modalRef={sectionDetailsModalRef}
        selectedSection={selectedSection}
        breadcrumbs={breadcrumbs}
        sectionRenderState={sectionRenderState}
        linkedMarkerName={linkedSectionMarker?.name ?? null}
        onOpenBreadcrumb={openSectionDetails}
        onGoToMap={
          linkedSectionMarker
            ? () =>
                focusMarker(
                  linkedSectionMarker.id,
                  closeSectionDetailsModal,
                )
            : undefined
        }
        onEdit={(section) => {
          closeSectionDetailsModal()
          openEditSectionModal(section)
        }}
        onClose={closeSectionDetailsModal}
      />

      <MapSectionFormModal
        isOpen={isSectionModalOpen}
        modalRef={sectionModalRef}
        sectionNameInputId={sectionNameInputId}
        sectionNameInputRef={sectionNameInputRef}
        editingSection={editingSection}
        sectionForm={sectionForm}
        sectionFormError={sectionFormError}
        saving={sectionSaving}
        sectionImageUploading={sectionImageUploading}
        parentOptions={parentOptions}
        markerOptions={markerLinkSelectOptions}
        onChangeForm={(updater) => setSectionForm(updater)}
        onOpenCustomFieldModal={openCustomFieldModal}
        onAddImage={openSectionImagePicker}
        onRemoveImage={(imageUrl) => void removeSectionImage(imageUrl)}
        onSave={() => void saveSection()}
        onClose={closeSectionModal}
        onDelete={(section) => void deleteSection(section)}
      />

      <MapSectionConflictModal
        isOpen={Boolean(pendingSectionConflict)}
        modalRef={sectionConflictModalRef}
        pendingSectionConflict={pendingSectionConflict}
        saving={sectionSaving}
        onKeepMarker={() => void resolveSectionConflict("marker")}
        onKeepSection={() => void resolveSectionConflict("section")}
        onGoToMap={(markerId) => {
          focusMarker(markerId, () => {
            closeConflictModal()
            closeSectionModal()
          })
        }}
        onClose={closeConflictModal}
      />

      <MapSectionCustomFieldModal
        isOpen={isCustomFieldModalOpen}
        modalRef={customFieldModalRef}
        customFieldKeyInputRef={customFieldKeyInputRef}
        draft={customFieldDraft}
        error={customFieldError}
        onChangeDraft={setCustomFieldDraft}
        onSave={handleSaveCustomField}
        onClose={closeCustomFieldModal}
      />
      <input
        ref={sectionImageInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenFileInput}
        onChange={handleSectionImageChange}
      />
    </div>
  )
}
