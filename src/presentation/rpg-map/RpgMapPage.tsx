"use client"

import Link from "next/link"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { ChevronDown, ChevronRight, Map as MapIcon, Pencil, Plus, Search, Trash2, X } from "lucide-react"
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
  deleteRpgMapSectionUseCase,
  deleteRpgMapUseCase,
  loadRpgMapDetailUseCase,
  loadRpgMapsUseCase,
  reorderRpgMapSectionUseCase,
  updateRpgMapSectionUseCase,
  updateRpgMapUseCase,
} from "@/application/rpgMap/use-cases/rpgMap"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"
import { MundiMap } from "@/presentation/rpg-map/WorldMap"
import styles from "./RpgMapPage.module.css"

type RpgMapPageProps = {
  rpgId: string
  rpgTitle: string
  view?: "catalog" | "detail"
  initialMapId?: string | null
  detailTitle?: string | null
}

type MapFormState = {
  title: string
  description: string
  type: string
}

type SectionFormState = {
  name: string
  description: string
  type: string
  parentSectionId: string
  aboutLink: string
  customFields: Array<{ id: string; name: string; value: string }>
}

const EMPTY_MAP_FORM: MapFormState = {
  title: "",
  description: "",
  type: "",
}

const EMPTY_SECTION_FORM: SectionFormState = {
  name: "",
  description: "",
  type: "",
  parentSectionId: "",
  aboutLink: "",
  customFields: [],
}

function parseJsonObject(text: string, fieldLabel: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return {}
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error()
    }
    return parsed as JsonMapValue
  } catch {
    throw new Error(`${fieldLabel} precisa ser um objeto JSON valido.`)
  }
}

function parseOptionalJsonObject(text: string, fieldLabel: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }
  return parseJsonObject(trimmed, fieldLabel)
}

function customFieldsToDraft(value: JsonMapValue | null | undefined) {
  return Object.entries(value ?? {})
    .filter(([name]) => name !== "Sobre")
    .map(([name, fieldValue], index) => ({
    id: `field-${index}-${name}`,
    name,
    value: fieldValue == null ? "" : String(fieldValue),
    }))
}

function getAboutLink(value: JsonMapValue | null | undefined) {
  const about = value?.Sobre
  return typeof about === "string" ? about : ""
}

function customFieldsToObject(fields: Array<{ name: string; value: string }>, aboutLink: string) {
  const entries = fields
    .map((field) => ({
      name: field.name.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.name.length > 0)

  const normalizedAboutLink = aboutLink.trim()
  if (normalizedAboutLink) {
    entries.unshift({ name: "Sobre", value: normalizedAboutLink })
  }

  if (entries.length === 0) {
    return null
  }

  return Object.fromEntries(entries.map((field) => [field.name, field.value]))
}

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

function MapTreeNode(props: {
  node: RpgMapSectionTreeNodeDto
  selectedId: string | null
  canManageStructure: boolean
  onSelect: (sectionId: string) => void
  onCreateChild: (section: RpgMapSectionDto) => void
  onEdit: (section: RpgMapSectionDto) => void
  onDelete: (section: RpgMapSectionDto) => void
  onReorder: (sectionId: string, direction: "up" | "down") => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = props.node.children.length > 0

  return (
    <li className={styles.treeNode}>
      <div
        className={`${styles.treeRow} ${props.selectedId === props.node.id ? styles.treeRowActive : ""}`}
      >
        <button
          type="button"
          className={styles.treeToggle}
          onClick={() => setIsOpen((current) => !current)}
          disabled={!hasChildren}
          aria-label={hasChildren ? (isOpen ? "Recolher secoes" : "Expandir secoes") : "Sem filhos"}
        >
          {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span />}
        </button>
        <button type="button" className={styles.treeLabel} onClick={() => props.onSelect(props.node.id)}>
          <span>{props.node.name}</span>
          {props.node.type ? <small>{props.node.type}</small> : null}
        </button>
        <div className={styles.treeActions}>
          {props.canManageStructure ? (
            <>
              <button type="button" className={styles.iconButton} onClick={() => props.onCreateChild(props.node)} title="Criar abaixo">
                <Plus size={14} />
              </button>
              <button type="button" className={styles.iconButton} onClick={() => props.onReorder(props.node.id, "up")} title="Subir">
                <ChevronRight size={14} className={styles.rotateUp} />
              </button>
              <button type="button" className={styles.iconButton} onClick={() => props.onReorder(props.node.id, "down")} title="Descer">
                <ChevronRight size={14} className={styles.rotateDown} />
              </button>
            </>
          ) : null}
          {props.node.canEdit ? (
            <button type="button" className={styles.iconButton} onClick={() => props.onEdit(props.node)} title="Editar">
              <Pencil size={14} />
            </button>
          ) : null}
          {props.node.canDelete ? (
            <button type="button" className={styles.iconButtonDanger} onClick={() => props.onDelete(props.node)} title="Apagar">
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      </div>
      {hasChildren && isOpen ? (
        <ul className={styles.treeList}>
          {props.node.children.map((child) => (
            <MapTreeNode key={child.id} {...props} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function RpgMapPage({
  rpgId,
  rpgTitle,
  view = "catalog",
  initialMapId = null,
  detailTitle = null,
}: RpgMapPageProps) {
  const sectionNameInputId = useId()
  const mapModalRef = useRef<HTMLElement | null>(null)
  const sectionModalRef = useRef<HTMLElement | null>(null)
  const sectionNameInputRef = useRef<HTMLInputElement | null>(null)
  const [maps, setMaps] = useState<RpgMapDto[]>([])
  const [selectedMapId, setSelectedMapId] = useState<string | null>(initialMapId)
  const [detail, setDetail] = useState<RpgMapDetailViewDto | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [loadingMaps, setLoadingMaps] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [sectionSearch, setSectionSearch] = useState("")
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [editingMap, setEditingMap] = useState<RpgMapDto | null>(null)
  const [mapForm, setMapForm] = useState<MapFormState>(EMPTY_MAP_FORM)
  const [mapFormError, setMapFormError] = useState("")
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<RpgMapSectionDto | null>(null)
  const [sectionForm, setSectionForm] = useState<SectionFormState>(EMPTY_SECTION_FORM)
  const [sectionFormError, setSectionFormError] = useState("")
  const [saving, setSaving] = useState(false)

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
  const canEditMapContent = Boolean(detail)
  const canManageMapImage = Boolean(detail?.canManage || detail?.map.canEdit)
  const canManagePublicMarkers = Boolean(detail?.canManage)

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

  function openCreateMapModal() {
    setEditingMap(null)
    setMapForm(EMPTY_MAP_FORM)
    setMapFormError("")
    setIsMapModalOpen(true)
  }

  function openEditMapModal(map: RpgMapDto) {
    setEditingMap(map)
    setMapForm({
      title: map.title,
      description: map.description ?? "",
      type: map.type ?? "",
    })
    setMapFormError("")
    setIsMapModalOpen(true)
  }

  function openCreateSectionModal(parent?: RpgMapSectionDto | null) {
    setEditingSection(null)
    setSectionForm({
      ...EMPTY_SECTION_FORM,
      parentSectionId: parent?.id ?? "",
    })
    setSectionFormError("")
    setIsSectionModalOpen(true)
  }

  function openEditSectionModal(section: RpgMapSectionDto) {
    setEditingSection(section)
    setSectionForm({
      name: section.name,
      description: section.description ?? "",
      type: section.type ?? "",
      parentSectionId: section.parentSectionId ?? "",
      aboutLink: getAboutLink(section.customFields),
      customFields: customFieldsToDraft(section.customFields),
    })
    setSectionFormError("")
    setIsSectionModalOpen(true)
  }

  useEffect(() => {
    if (!isSectionModalOpen) {
      return
    }

    queueMicrotask(() => {
      sectionNameInputRef.current?.focus()
    })
  }, [isSectionModalOpen, sectionNameInputId])

  useEffect(() => {
    const activeModal = isSectionModalOpen ? sectionModalRef.current : isMapModalOpen ? mapModalRef.current : null
    if (!activeModal) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ")

    const getFocusableElements = () =>
      Array.from(activeModal.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
      )

    const firstFocusable = getFocusableElements()[0] ?? activeModal
    queueMicrotask(() => {
      firstFocusable.focus()
    })

    function handleFocusIn(event: FocusEvent) {
      const currentModal = isSectionModalOpen ? sectionModalRef.current : isMapModalOpen ? mapModalRef.current : null
      if (!currentModal) {
        return
      }

      if (event.target instanceof HTMLElement && currentModal.contains(event.target)) {
        return
      }

      const firstElement = getFocusableElements()[0] ?? currentModal
      firstElement.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") {
        return
      }

      const currentModal = isSectionModalOpen ? sectionModalRef.current : isMapModalOpen ? mapModalRef.current : null
      if (!currentModal) {
        return
      }

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        currentModal.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMapModalOpen, isSectionModalOpen])

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
      setIsMapModalOpen(false)
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

  async function handleSaveSection() {
    if (!selectedMapId) return

    try {
      setSaving(true)
      setSectionFormError("")
      const payload = {
        name: sectionForm.name.trim(),
        description: sectionForm.description.trim() || null,
        type: sectionForm.type.trim() || null,
        parentSectionId: sectionForm.parentSectionId || null,
        customFields: customFieldsToObject(sectionForm.customFields, sectionForm.aboutLink),
      }

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

      await loadDetail(selectedMapId, section.id)
      await loadMaps()
      setIsSectionModalOpen(false)
      toast.success(editingSection ? "Secao atualizada com sucesso." : "Secao criada com sucesso.")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao salvar secao."
      setSectionFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
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
              {canEditMapContent ? (
                <div className={styles.headerActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => openEditMapModal(detail.map)}>
                    <Pencil size={16} />
                    <span>Editar mapa</span>
                  </button>
                </div>
              ) : null}

              <MundiMap
                rpgId={rpgId}
                mapId={detail.map.id}
                canEditContent={canEditMapContent}
                canManageImage={canManageMapImage}
                canManagePublicMarkers={canManagePublicMarkers}
                initialMapSrc={detail.map.image}
                initialPublicMarkerGroups={detail.markerGroups}
              />

              <div className={styles.workspace}>
                <section className={styles.panel}>
                  <div className={styles.groupHeaderStatic}>
                    <div className={styles.groupHeaderInfo}>
                      <h3 className={styles.groupTitle}>Visibilidade</h3>
                      <p className={styles.groupSubtitle}>Estrutura em arvore das secoes e areas descobertas.</p>
                    </div>
                    {canEditMapContent ? (
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => openCreateSectionModal(selectedSection)}
                      >
                        <Plus size={14} />
                      </button>
                    ) : null}
                  </div>
                  <label className={styles.searchField}>
                    <Search size={16} />
                    <input
                      type="search"
                      value={sectionSearch}
                      onChange={(event) => setSectionSearch(event.target.value)}
                      placeholder="Buscar secoes..."
                    />
                  </label>
                  {filteredTree.length === 0 ? (
                    <p className={styles.feedback}>Nenhuma secao encontrada.</p>
                  ) : (
                    <ul className={styles.treeList}>
                      {filteredTree.map((node) => (
                        <MapTreeNode
                          key={node.id}
                          node={node}
                          selectedId={selectedSectionId}
                          canManageStructure={canEditMapContent}
                          onSelect={setSelectedSectionId}
                          onCreateChild={openCreateSectionModal}
                          onEdit={openEditSectionModal}
                          onDelete={(section) => void handleDeleteSection(section)}
                          onReorder={(sectionId, direction) => void handleReorderSection(sectionId, direction)}
                        />
                      ))}
                    </ul>
                  )}
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h3>Detalhes da secao</h3>
                    {selectedSection ? (
                      <div className={styles.inlineActions}>
                        {selectedSection.canEdit ? (
                          <button type="button" className={styles.iconButton} onClick={() => openEditSectionModal(selectedSection)}>
                            <Pencil size={14} />
                          </button>
                        ) : null}
                        {canEditMapContent ? (
                          <button type="button" className={styles.iconButton} onClick={() => openCreateSectionModal(selectedSection)}>
                            <Plus size={14} />
                          </button>
                        ) : null}
                        {selectedSection.canDelete ? (
                          <button type="button" className={styles.iconButtonDanger} onClick={() => void handleDeleteSection(selectedSection)}>
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {breadcrumbs.length > 0 ? (
                    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                      {breadcrumbs.map((crumb) => (
                        <button key={crumb.id} type="button" onClick={() => setSelectedSectionId(crumb.id)}>
                          {crumb.label}
                        </button>
                      ))}
                    </nav>
                  ) : null}

                  {selectedSection ? (
                    <div className={styles.detailCard}>
                      <h4>{selectedSection.name}</h4>
                      <p>{selectedSection.description || "Sem descricao cadastrada."}</p>
                      {getAboutLink(selectedSection.customFields) ? (
                        <a
                          className={styles.aboutLink}
                          href={getAboutLink(selectedSection.customFields)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Sobre
                        </a>
                      ) : null}
                      <dl className={styles.metaGrid}>
                        <div>
                          <dt>Tipo</dt>
                          <dd>{selectedSection.type || "Livre"}</dd>
                        </div>
                        <div>
                          <dt>Pai</dt>
                          <dd>
                            {selectedSection.parentSectionId
                              ? detail.sections.find((section) => section.id === selectedSection.parentSectionId)?.name ?? "-"
                              : "Raiz"}
                          </dd>
                        </div>
                      </dl>
                      <div className={styles.jsonBlock}>
                        <strong>Custom fields</strong>
                        {selectedSection.customFields && Object.keys(selectedSection.customFields).length > 0 ? (
                          <dl className={styles.customFieldList}>
                            {Object.entries(selectedSection.customFields).map(([name, value]) => (
                              <div key={name} className={styles.customFieldItem}>
                                <dt>{name}</dt>
                                <dd>{value == null ? "-" : String(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className={styles.feedback}>Nenhum campo customizado.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className={styles.feedback}>Selecione uma secao para ver os detalhes.</p>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {isMapModalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Salvar mapa">
          <section ref={mapModalRef} className={styles.modal} tabIndex={-1}>
            <h2>{editingMap ? "Editar mapa" : "Criar mapa"}</h2>
            <label className={styles.field}>
              <span>Nome</span>
              <input value={mapForm.title} onChange={(event) => setMapForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Descricao</span>
              <textarea rows={3} value={mapForm.description} onChange={(event) => setMapForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Tipo</span>
              <input value={mapForm.type} onChange={(event) => setMapForm((current) => ({ ...current, type: event.target.value }))} placeholder="planet, kingdom, station..." />
            </label>
            {mapFormError ? <p className={styles.error}>{mapFormError}</p> : null}
            <div className={styles.modalActions}>
              <button type="button" className={styles.primaryButton} onClick={() => void handleSaveMap()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setIsMapModalOpen(false)} disabled={saving}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isSectionModalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Salvar secao">
          <section ref={sectionModalRef} className={styles.modal} tabIndex={-1}>
            <h2>{editingSection ? "Editar secao" : "Criar secao"}</h2>
            <label className={styles.field}>
              <span>Nome</span>
              <input
                id={sectionNameInputId}
                ref={sectionNameInputRef}
                value={sectionForm.name}
                onChange={(event) => setSectionForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Descricao</span>
              <textarea rows={3} value={sectionForm.description} onChange={(event) => setSectionForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Tipo</span>
              <input value={sectionForm.type} onChange={(event) => setSectionForm((current) => ({ ...current, type: event.target.value }))} placeholder="city, base, biome..." />
            </label>
            <label className={styles.field}>
              <span>Secao pai</span>
              <select value={sectionForm.parentSectionId} onChange={(event) => setSectionForm((current) => ({ ...current, parentSectionId: event.target.value }))}>
                <option value="">Raiz</option>
                {collectSectionOptions(detail?.sections ?? [], editingSection?.id).map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Sobre</span>
              <input
                value={sectionForm.aboutLink}
                onChange={(event) => setSectionForm((current) => ({ ...current, aboutLink: event.target.value }))}
                placeholder="https://..."
              />
            </label>
            <div className={styles.field}>
              <div className={styles.customFieldsHeader}>
                <span>Campos customizados</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    setSectionForm((current) => ({
                      ...current,
                      customFields: [
                        ...current.customFields,
                        { id: crypto.randomUUID(), name: "", value: "" },
                      ],
                    }))
                  }
                >
                  <Plus size={14} />
                  <span>Adicionar campo</span>
                </button>
              </div>
              {sectionForm.customFields.length > 0 ? (
                <div className={styles.customFieldsEditor}>
                  {sectionForm.customFields.map((field) => (
                    <div key={field.id} className={styles.customFieldEditorRow}>
                      <input
                        value={field.name}
                        onChange={(event) =>
                          setSectionForm((current) => ({
                            ...current,
                            customFields: current.customFields.map((item) =>
                              item.id === field.id ? { ...item, name: event.target.value } : item,
                            ),
                          }))
                        }
                        placeholder="Nome"
                      />
                      <input
                        value={field.value}
                        onChange={(event) =>
                          setSectionForm((current) => ({
                            ...current,
                            customFields: current.customFields.map((item) =>
                              item.id === field.id ? { ...item, value: event.target.value } : item,
                            ),
                          }))
                        }
                        placeholder="Valor"
                      />
                      <button
                        type="button"
                        className={styles.iconButtonDanger}
                        onClick={() =>
                          setSectionForm((current) => ({
                            ...current,
                            customFields: current.customFields.filter((item) => item.id !== field.id),
                          }))
                        }
                        aria-label="Remover campo"
                        title="Remover campo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.feedback}>Nenhum campo customizado adicionado.</p>
              )}
            </div>
            {sectionFormError ? <p className={styles.error}>{sectionFormError}</p> : null}
            <div className={styles.modalActions}>
              <button type="button" className={styles.primaryButton} onClick={() => void handleSaveSection()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setIsSectionModalOpen(false)} disabled={saving}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
