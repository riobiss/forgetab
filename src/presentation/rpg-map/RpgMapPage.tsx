"use client"

import Link from "next/link"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { toast } from "react-hot-toast"
import { Map as MapIcon, Pencil, Plus, Search, Trash2 } from "lucide-react"
import type {
  JsonMapValue,
  RpgMapBreadcrumbDto,
  RpgMapDetailViewDto,
  RpgMapDto,
  RpgMapSectionDto,
  RpgMapSectionTreeNodeDto,
} from "@/application/rpgMap/types"
import {
  createRpgMapSectionUseCase,
  createRpgMapUseCase,
  deleteRpgMapSectionImageByUrlUseCase,
  deleteRpgMapSectionUseCase,
  deleteRpgMapUseCase,
  loadRpgMapDetailUseCase,
  loadRpgMapsUseCase,
  reorderRpgMapSectionUseCase,
  uploadRpgMapSectionImageUseCase,
  updateRpgMapSectionUseCase,
  updateRpgMapUseCase,
} from "@/application/rpgMap/use-cases/rpgMap"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"
import {
  MARKER_STORAGE_PREFIX,
  parsePrivateMarkerGroupsFromStorage,
} from "@/presentation/rpg-map/hooks/useMapMarkerGroupStore"
import { useRpgMapFormModalState } from "@/presentation/rpg-map/hooks/useRpgMapFormModalState"
import { useRpgMapPageModalFocus } from "@/presentation/rpg-map/hooks/useRpgMapPageModalFocus"
import {
  useRpgMapSectionModalState,
} from "@/presentation/rpg-map/hooks/useRpgMapSectionModalState"
import { MapSectionConflictModal } from "@/presentation/rpg-map/components/MapSectionConflictModal"
import { MapSectionCustomFieldModal } from "@/presentation/rpg-map/components/MapSectionCustomFieldModal"
import { MapFormModal } from "@/presentation/rpg-map/components/MapFormModal"
import { MapSectionFormModal } from "@/presentation/rpg-map/components/MapSectionFormModal"
import { MapSectionDetailsModal } from "@/presentation/rpg-map/components/MapSectionDetailsModal"
import { MapSectionTree } from "@/presentation/rpg-map/components/MapSectionTree"
import { syncLinkedMarkerWithSection } from "@/presentation/rpg-map/services/syncLinkedMarkerWithSection"
import { MundiMap } from "@/presentation/rpg-map/WorldMap"
import {
  applySectionImagesToCustomFields,
  applyLinkedMarkerToPayload,
  buildLinkedSectionSnapshots,
  buildMarkerOptions,
  buildSectionRenderState,
  customFieldsToObject,
  findLinkedMarkerConflicts,
  getLinkedMarkerId,
  SECTION_LINK_MARKER_GROUP_ID,
  SECTION_LINK_MARKER_ID,
  SECTION_LINK_MARKER_NAME,
  type MarkerLinkOption,
  type SectionSavePayload,
} from "@/presentation/rpg-map/utils/sectionMarkerLinking"
import styles from "./RpgMapPage.module.css"

type RpgMapPageProps = {
  rpgId: string
  rpgTitle: string
  view?: "catalog" | "detail"
  initialMapId?: string | null
  detailTitle?: string | null
}

const SECTION_MARKER_COLORS = ["#f97316", "#f5b33b", "#60a5fa", "#34d399", "#f472b6", "#a78bfa"]

function buildBreadcrumbs(
  selectedSectionId: string | null,
  sections: RpgMapSectionDto[],
): RpgMapBreadcrumbDto[] {
  if (!selectedSectionId) return []

  const byId = new Map(sections.map((section) => [section.id, section]))
  const trail: RpgMapBreadcrumbDto[] = []
  let current = byId.get(selectedSectionId) ?? null

  while (current) {
    trail.unshift({ id: current.id, label: current.name })
    current = current.parentSectionId ? byId.get(current.parentSectionId) ?? null : null
  }

  return trail
}

function filterTree(nodes: RpgMapSectionTreeNodeDto[], query: string): RpgMapSectionTreeNodeDto[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return nodes

  return nodes
    .map((node) => {
      const children = filterTree(node.children, query)
      const matches =
        node.name.toLowerCase().includes(normalized) ||
        (node.description ?? "").toLowerCase().includes(normalized) ||
        (node.type ?? "").toLowerCase().includes(normalized)

      if (!matches && children.length === 0) {
        return null
      }

      return { ...node, children }
    })
    .filter((node): node is RpgMapSectionTreeNodeDto => Boolean(node))
}

function collectSectionOptions(nodes: RpgMapSectionDto[], currentSectionId?: string | null) {
  return nodes
    .filter((section) => section.id !== currentSectionId)
    .map((section) => ({
      id: section.id,
      label: section.name,
    }))
}

export function RpgMapPage({
  rpgId,
  rpgTitle,
  view = "catalog",
  initialMapId = null,
  detailTitle = null,
}: RpgMapPageProps) {
  const sectionNameInputId = useId()
  const pageContentRef = useRef<HTMLDivElement | null>(null)
  const mapModalRef = useRef<HTMLElement | null>(null)
  const sectionModalRef = useRef<HTMLElement | null>(null)
  const sectionConflictModalRef = useRef<HTMLElement | null>(null)
  const sectionDetailsModalRef = useRef<HTMLElement | null>(null)
  const customFieldModalRef = useRef<HTMLElement | null>(null)
  const sectionNameInputRef = useRef<HTMLInputElement | null>(null)
  const customFieldKeyInputRef = useRef<HTMLInputElement | null>(null)
  const sectionImageInputRef = useRef<HTMLInputElement | null>(null)
  const mapFeatureRef = useRef<HTMLDivElement | null>(null)
  const [maps, setMaps] = useState<RpgMapDto[]>([])
  const [selectedMapId, setSelectedMapId] = useState<string | null>(initialMapId)
  const [detail, setDetail] = useState<RpgMapDetailViewDto | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [loadingMaps, setLoadingMaps] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [sectionSearch, setSectionSearch] = useState("")
  const [focusMarkerRequest, setFocusMarkerRequest] = useState<{ markerId: string; token: number } | null>(null)
  const [privateMarkerOptions, setPrivateMarkerOptions] = useState<MarkerLinkOption[]>([])
  const [isMapCollapsed, setIsMapCollapsed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sectionImageUploading, setSectionImageUploading] = useState(false)
  const {
    closeMapModal,
    editingMap,
    isMapModalOpen,
    mapForm,
    mapFormError,
    openCreateMapModal,
    openEditMapModal,
    setMapForm,
    setMapFormError,
  } = useRpgMapFormModalState()
  const {
    closeConflictModal,
    closeCustomFieldModal,
    closeSectionDetailsModal,
    closeSectionModal,
    customFieldDraft,
    customFieldError,
    editingSection,
    handleEscape,
    handleSaveCustomField,
    isCustomFieldModalOpen,
    isSectionDetailsModalOpen,
    isSectionModalOpen,
    openCreateSectionModal,
    openCustomFieldModal,
    openEditSectionModal,
    openSectionDetails,
    pendingSectionConflict,
    sectionForm,
    sectionFormError,
    setCustomFieldDraft,
    setPendingSectionConflict,
    setSectionForm,
    setSectionFormError,
  } = useRpgMapSectionModalState()

  const selectedSection = useMemo(
    () => detail?.sections.find((section) => section.id === selectedSectionId) ?? null,
    [detail?.sections, selectedSectionId],
  )
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(selectedSectionId, detail?.sections ?? []),
    [detail?.sections, selectedSectionId],
  )
  const filteredMaps = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) return maps

    return maps.filter((map) =>
      [map.title, map.description, map.type].some((value) => value?.toLowerCase().includes(normalizedSearch)),
    )
  }, [maps, search])
  const filteredTree = useMemo(
    () => filterTree(detail?.tree ?? [], sectionSearch),
    [detail?.tree, sectionSearch],
  )
  const markerOptions = useMemo(() => {
    const publicOptions = buildMarkerOptions(detail)
    const seen = new Set<string>()
    return [...publicOptions, ...privateMarkerOptions].filter((marker) => {
      if (seen.has(marker.id)) {
        return false
      }
      seen.add(marker.id)
      return true
    })
  }, [detail, privateMarkerOptions])
  const canEditMapContent = Boolean(detail)
  const canManageMapImage = Boolean(detail?.canManage || detail?.map.canEdit)
  const canManagePublicMarkers = Boolean(detail?.canManage)
  const linkedSectionMarker = useMemo(
    () => markerOptions.find((marker) => marker.id === getLinkedMarkerId(selectedSection?.customFields)) ?? null,
    [markerOptions, selectedSection?.customFields],
  )
  const sectionRenderState = useMemo(
    () => (selectedSection ? buildSectionRenderState(selectedSection, linkedSectionMarker) : null),
    [linkedSectionMarker, selectedSection],
  )
  const linkedSectionSnapshots = useMemo(
    () => buildLinkedSectionSnapshots(detail?.sections ?? []),
    [detail?.sections],
  )
  const markerSectionOptions = useMemo(
    () => (detail?.sections ?? []).map((section) => ({ id: section.id, name: section.name })),
    [detail?.sections],
  )

  const loadMaps = useCallback(async () => {
    try {
      setLoadingMaps(true)
      setError("")
      const payload = await loadRpgMapsUseCase(httpRpgMapGateway, { rpgId })
      setMaps(payload.maps)
      setSelectedMapId((current) => {
        if (view === "detail") {
          return initialMapId ?? current ?? null
        }
        return current ?? payload.maps[0]?.id ?? null
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao carregar mapas.")
    } finally {
      setLoadingMaps(false)
    }
  }, [initialMapId, rpgId, view])

  const loadDetail = useCallback(async (mapId: string, preferredSectionId?: string | null) => {
    try {
      setLoadingDetail(true)
      setError("")
      const payload = await loadRpgMapDetailUseCase(httpRpgMapGateway, { rpgId, mapId })
      setDetail(payload)
      setSelectedSectionId((current) => {
        const nextId = preferredSectionId ?? current
        return payload.sections.some((section) => section.id === nextId) ? nextId ?? null : payload.sections[0]?.id ?? null
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao carregar estrutura do mapa.")
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [rpgId])

  useEffect(() => {
    void loadMaps()
  }, [loadMaps])

  useEffect(() => {
    if (view === "detail" && initialMapId) {
      setSelectedMapId(initialMapId)
    }
  }, [initialMapId, view])

  useEffect(() => {
    if (selectedMapId) {
      void loadDetail(selectedMapId)
    } else {
      setDetail(null)
      setSelectedSectionId(null)
    }
  }, [loadDetail, selectedMapId])

  useEffect(() => {
    if (!selectedMapId) {
      setPrivateMarkerOptions([])
      return
    }

    try {
      const raw = window.localStorage.getItem(`${MARKER_STORAGE_PREFIX}${selectedMapId}`)
      const groups = parsePrivateMarkerGroupsFromStorage(raw, SECTION_MARKER_COLORS)
      setPrivateMarkerOptions(
        groups.flatMap((group) =>
          group.markers.map((marker) => ({
            id: marker.id,
            groupId: group.id,
            visibility: "private",
            name: marker.name,
            location: marker.location ?? null,
            shortDescription: marker.shortDescription ?? null,
            image: marker.image ?? null,
            color: marker.color || group.color,
            size: marker.size ?? null,
            pinStyle: marker.pinStyle ?? "default",
          })),
        ),
      )
    } catch {
      setPrivateMarkerOptions([])
    }
  }, [selectedMapId, detail?.markerGroups])

  useEffect(() => {
    if (!isSectionModalOpen) {
      return
    }

    queueMicrotask(() => {
      sectionNameInputRef.current?.focus()
    })
  }, [isSectionModalOpen, sectionNameInputId])

  useEffect(() => {
    if (!isCustomFieldModalOpen) {
      return
    }

    queueMicrotask(() => {
      customFieldKeyInputRef.current?.focus()
    })
  }, [isCustomFieldModalOpen])

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

  async function handleSaveMap() {
    try {
      setSaving(true)
      setMapFormError("")
      const payload = {
        title: mapForm.title.trim(),
        description: mapForm.description.trim() || null,
        type: mapForm.type.trim() || null,
        image: editingMap?.image ?? null,
      }

      const map = editingMap
        ? await updateRpgMapUseCase(httpRpgMapGateway, { rpgId, mapId: editingMap.id, payload })
        : await createRpgMapUseCase(httpRpgMapGateway, { rpgId, payload })

      await loadMaps()
      setSelectedMapId(map.id)
      closeMapModal()
      toast.success(editingMap ? "Mapa atualizado com sucesso." : "Mapa criado com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao salvar mapa."
      setMapFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMap(map: RpgMapDto) {
    if (!window.confirm(`Tem certeza que deseja apagar o mapa "${map.title}"?`)) return

    try {
      await deleteRpgMapUseCase(httpRpgMapGateway, { rpgId, mapId: map.id })
      toast.success("Mapa removido com sucesso.")
      const nextMaps = maps.filter((item) => item.id !== map.id)
      setMaps(nextMaps)
      setSelectedMapId(nextMaps[0]?.id ?? null)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao remover mapa."
      toast.error(message)
    }
  }

  async function persistSection(payload: SectionSavePayload, linkedMarker?: MarkerLinkOption | null) {
    if (!selectedMapId) return
    try {
      setSaving(true)
      setSectionFormError("")
      const section = editingSection
        ? await updateRpgMapSectionUseCase(httpRpgMapGateway, {
            rpgId,
            mapId: selectedMapId,
            sectionId: editingSection.id,
            payload,
          })
        : await createRpgMapSectionUseCase(httpRpgMapGateway, {
            rpgId,
            mapId: selectedMapId,
            payload,
          })

      if (linkedMarker) {
        await syncLinkedMarkerWithSection({
          rpgId,
          mapId: selectedMapId,
          detail,
          markerColors: SECTION_MARKER_COLORS,
          linkedMarker,
          payload,
        })
      }

      await loadDetail(selectedMapId, section.id)
      await loadMaps()
      closeConflictModal()
      closeSectionModal()
      toast.success(editingSection ? "Secao atualizada com sucesso." : "Secao criada com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao salvar secao."
      setSectionFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function handleGoToMarker(markerId: string) {
    mapFeatureRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    setFocusMarkerRequest({ markerId, token: Date.now() })
  }

  function handleOpenSectionFromMarker(sectionId: string) {
    openSectionDetails(sectionId, setSelectedSectionId)
  }

  function removeMarkerLinkFields(customFields: JsonMapValue | null) {
    const nextCustomFields = { ...(customFields ?? {}) }
    delete nextCustomFields[SECTION_LINK_MARKER_ID]
    delete nextCustomFields[SECTION_LINK_MARKER_GROUP_ID]
    delete nextCustomFields[SECTION_LINK_MARKER_NAME]
    return Object.keys(nextCustomFields).length > 0 ? nextCustomFields : null
  }

  async function handleSaveMarkerSectionLink(markerId: string, sectionId: string | null) {
    if (!selectedMapId || !detail) {
      return
    }

    const linkedMarker = markerOptions.find((marker) => marker.id === markerId) ?? null
    if (!linkedMarker) {
      return
    }

    const currentLinkedSections = detail.sections.filter((section) => getLinkedMarkerId(section.customFields) === markerId)
    const sectionsToClear = currentLinkedSections.filter((section) => section.id !== sectionId)

    for (const section of sectionsToClear) {
      await updateRpgMapSectionUseCase(httpRpgMapGateway, {
        rpgId,
        mapId: selectedMapId,
        sectionId: section.id,
        payload: {
          name: section.name,
          description: section.description,
          type: section.type,
          parentSectionId: section.parentSectionId,
          customFields: removeMarkerLinkFields(section.customFields),
        },
      })
    }

    if (sectionId) {
      const targetSection = detail.sections.find((section) => section.id === sectionId) ?? null
      if (targetSection) {
        const payload = applyLinkedMarkerToPayload(
          {
            name: targetSection.name,
            description: targetSection.description,
            type: targetSection.type,
            parentSectionId: targetSection.parentSectionId,
            customFields: removeMarkerLinkFields(targetSection.customFields),
          },
          linkedMarker,
          "marker",
        )

        await updateRpgMapSectionUseCase(httpRpgMapGateway, {
          rpgId,
          mapId: selectedMapId,
          sectionId: targetSection.id,
          payload,
        })
      }
    }

    await loadDetail(selectedMapId, sectionId)
  }

  async function handleSaveSection() {
    const trimmedName = sectionForm.name.trim()
    const payload: SectionSavePayload = {
      name: trimmedName,
      description: sectionForm.description.trim() || null,
      type: sectionForm.type.trim() || null,
      parentSectionId: sectionForm.parentSectionId || null,
      customFields: applySectionImagesToCustomFields(
        customFieldsToObject(sectionForm.customFields),
        sectionForm.images,
      ),
    }

    const linkedMarker = markerOptions.find((marker) => marker.id === sectionForm.linkedMarkerId) ?? null
    if (!trimmedName && !linkedMarker) {
      setSectionFormError("Nome e obrigatorio, a menos que a secao esteja vinculada a um marcador.")
      return
    }

    if (!linkedMarker) {
      await persistSection(payload)
      return
    }

    const conflicts = findLinkedMarkerConflicts(payload, linkedMarker)
    if (conflicts.length > 0) {
      setPendingSectionConflict({
        payload,
        linkedMarker,
        fields: conflicts,
      })
      return
    }

    const mergedPayload = applyLinkedMarkerToPayload(payload, linkedMarker, "section")
    await persistSection(mergedPayload, linkedMarker)
  }

  function openSectionImagePicker() {
    if (sectionImageUploading || sectionForm.images.length >= 5) {
      return
    }

    sectionImageInputRef.current?.click()
  }

  async function handleSectionImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem valida para a secao.")
      return
    }

    setSectionImageUploading(true)
    try {
      const payload = await uploadRpgMapSectionImageUseCase(httpRpgMapGateway, { file })
      setSectionForm((current) => ({
        ...current,
        images: [...current.images, payload.url].slice(0, 5),
      }))
      toast.success("Imagem da secao adicionada com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao enviar imagem da secao."
      toast.error(message)
    } finally {
      setSectionImageUploading(false)
    }
  }

  async function handleRemoveSectionImage(imageUrl: string) {
    if (sectionImageUploading) {
      return
    }

    setSectionImageUploading(true)
    try {
      await deleteRpgMapSectionImageByUrlUseCase(httpRpgMapGateway, { url: imageUrl })
      setSectionForm((current) => ({
        ...current,
        images: current.images.filter((image) => image !== imageUrl),
      }))
      toast.success("Imagem da secao removida com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao remover imagem da secao."
      toast.error(message)
    } finally {
      setSectionImageUploading(false)
    }
  }

  async function handleResolveSectionConflict(preference: "marker" | "section") {
    if (!pendingSectionConflict) {
      return
    }

    const mergedPayload = applyLinkedMarkerToPayload(
      pendingSectionConflict.payload,
      pendingSectionConflict.linkedMarker,
      preference,
    )
    await persistSection(mergedPayload, pendingSectionConflict.linkedMarker)
  }

  async function handleDeleteSection(section: RpgMapSectionDto) {
    if (!selectedMapId) return
    if (!window.confirm(`Tem certeza que deseja apagar a secao "${section.name}" e suas subsecoes?`)) return

    try {
      await deleteRpgMapSectionUseCase(httpRpgMapGateway, {
        rpgId,
        mapId: selectedMapId,
        sectionId: section.id,
      })
      await loadDetail(selectedMapId)
      await loadMaps()
      toast.success("Secao removida com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao remover secao."
      toast.error(message)
    }
  }

  async function handleReorderSection(sectionId: string, direction: "up" | "down") {
    if (!selectedMapId) return

    try {
      await reorderRpgMapSectionUseCase(httpRpgMapGateway, {
        rpgId,
        mapId: selectedMapId,
        sectionId,
        direction,
      })
      await loadDetail(selectedMapId, sectionId)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao reordenar secao."
      toast.error(message)
    }
  }

  return (
    <main className={styles.page}>
      <div ref={pageContentRef}>
      <section className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>{view === "detail" ? "Mapa" : rpgTitle}</p>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{view === "detail" ? detailTitle || detail?.map.title || "Mapa" : "Mapa"}</h1>
            {view === "catalog" ? (
              <button type="button" className={styles.primaryButton} onClick={openCreateMapModal}>
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

          {loadingMaps ? <p className={styles.feedback}>Carregando mapas...</p> : null}
          {error && !loadingMaps ? <p className={styles.error}>{error}</p> : null}

          {!loadingMaps && filteredMaps.length === 0 ? (
            <section className={styles.emptyPanel}>
              <p>{maps.length === 0 ? "Nenhum mapa cadastrado ainda." : "Nenhum mapa encontrado com a busca atual."}</p>
            </section>
          ) : null}

          {filteredMaps.length > 0 ? (
            <section className={styles.groups}>
              <article className={styles.group}>
                <div className={styles.groupHeaderStatic}>
                  <div className={styles.groupHeaderInfo}>
                    <h2 className={styles.groupTitle}>Mapas</h2>
                    <p className={styles.groupSubtitle}>Escolha um mapa para abrir a visao principal.</p>
                  </div>
                  <span className={styles.groupBadge}>{filteredMaps.length}</span>
                </div>

                <div className={styles.groupContent}>
                  <div className={styles.mapList}>
                    {filteredMaps.map((map) => (
                      <article
                        key={map.id}
                        className={`${styles.mapCard} ${selectedMapId === map.id ? styles.mapCardActive : ""}`}
                      >
                        <Link href={`/rpg/${rpgId}/map/${map.id}`} className={styles.mapCardMain}>
                          <div className={styles.mapCardHeader}>
                            <MapIcon size={16} />
                            <strong>{map.title}</strong>
                          </div>
                          <p>{map.description || "Sem descricao."}</p>
                          <small>{map.sectionsCount ?? 0} secoes</small>
                        </Link>
                        <div className={styles.mapCardActions}>
                          {map.canEdit ? (
                            <button type="button" className={styles.iconButton} onClick={() => openEditMapModal(map)}>
                              <Pencil size={14} />
                            </button>
                          ) : null}
                          {map.canDelete ? (
                            <button
                              type="button"
                              className={styles.iconButtonDanger}
                              onClick={() => void handleDeleteMap(map)}
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
          {loadingDetail ? <p className={styles.feedback}>Carregando estrutura...</p> : null}

          {!loadingDetail && detail ? (
            <>
              {canEditMapContent || detail ? (
                <div className={styles.headerActions}>
                  {canEditMapContent ? (
                    <button type="button" className={styles.secondaryButton} onClick={() => openEditMapModal(detail.map)}>
                      <Pencil size={16} />
                      <span>Editar mapa</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setIsMapCollapsed((current) => !current)}
                  >
                    <span>{isMapCollapsed ? "Expandir mapa" : "Recolher mapa"}</span>
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
                    onOpenLinkedSection={handleOpenSectionFromMarker}
                    onSaveMarkerSectionLink={handleSaveMarkerSectionLink}
                  />
                </div>
              ) : null}

              <MapSectionTree
                canCreate={canEditMapContent}
                filteredTree={filteredTree}
                sectionSearch={sectionSearch}
                onChangeSearch={setSectionSearch}
                onCreate={() => openCreateSectionModal(selectedSection)}
                onSelect={(sectionId) => openSectionDetails(sectionId, setSelectedSectionId)}
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
        saving={saving}
        onChangeForm={setMapForm}
        onSave={() => void handleSaveMap()}
        onClose={closeMapModal}
      />

      <MapSectionDetailsModal
        isOpen={isSectionDetailsModalOpen}
        modalRef={sectionDetailsModalRef}
        selectedSection={selectedSection}
        breadcrumbs={breadcrumbs}
        sectionRenderState={sectionRenderState}
        onOpenBreadcrumb={(sectionId) => openSectionDetails(sectionId, setSelectedSectionId)}
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
        saving={saving}
        sectionImageUploading={sectionImageUploading}
        parentOptions={collectSectionOptions(detail?.sections ?? [], editingSection?.id)}
        markerOptions={markerOptions.map((marker) => ({ id: marker.id, name: marker.name }))}
        onChangeForm={(updater) => setSectionForm(updater)}
        onOpenCustomFieldModal={openCustomFieldModal}
        onAddImage={openSectionImagePicker}
        onRemoveImage={(imageUrl) => void handleRemoveSectionImage(imageUrl)}
        onSave={() => void handleSaveSection()}
        onClose={closeSectionModal}
        onDelete={(section) => {
          void handleDeleteSection(section)
          closeSectionModal()
        }}
      />

      <MapSectionConflictModal
        isOpen={Boolean(pendingSectionConflict)}
        modalRef={sectionConflictModalRef}
        pendingSectionConflict={pendingSectionConflict}
        saving={saving}
        onKeepMarker={() => void handleResolveSectionConflict("marker")}
        onKeepSection={() => void handleResolveSectionConflict("section")}
        onGoToMap={(markerId) => {
          closeConflictModal()
          closeSectionModal()
          handleGoToMarker(markerId)
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
    </main>
  )
}
