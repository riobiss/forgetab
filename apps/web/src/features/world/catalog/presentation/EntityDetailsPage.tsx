"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { Keyboard, Save, SlidersHorizontal } from "lucide-react"
import { toast } from "react-hot-toast"
import type {
  EntityCatalogAbilityPurchaseState,
  EntityCatalogAbilityView,
  EntityCatalogCurrentDetail,
  EntityCatalogPlayerItem,
  EntityCatalogTemplateOption,
  EntityCatalogTemplateRecord,
} from "@/features/world/catalog/application/types"
import {
  createRichTextDocumentFromText,
  EMPTY_RICH_TEXT_DOCUMENT,
} from "@/features/world/catalog/domain/catalogMeta"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import EntityDetailsConfigModal, {
  type EntityDetailsConfigStage,
} from "@/features/world/catalog/presentation/EntityDetailsConfigModal"
import EntityDetailsContent from "@/features/world/catalog/presentation/EntityDetailsContent"
import { useEntityDetailsActions } from "@/features/world/catalog/presentation/useEntityDetailsActions"
import { useModalFocusTrap } from "@/features/world/catalog/presentation/useModalFocusTrap"
import { dismissToast } from "@/lib/toast"
import styles from "./EntityDetailsPage.module.css"

type BonusInputRecord = Record<string, string | number>

type Props = {
  rpgId: string
  entityType: CatalogEntityType
  title: string
  entityLabel: string
  canManage: boolean
  showCategoryField?: boolean
  current: EntityCatalogCurrentDetail
  attributeTemplates: EntityCatalogTemplateOption[]
  skillTemplates: EntityCatalogTemplateOption[]
  abilities?: EntityCatalogAbilityView[]
  players?: EntityCatalogPlayerItem[]
  abilityPurchase?: EntityCatalogAbilityPurchaseState
}

function parseBonusRecord(record: BonusInputRecord): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      value === "" ? 0 : Number(value),
    ]),
  )
}

function getActiveBonuses(
  templates: EntityCatalogTemplateOption[],
  bonuses: BonusInputRecord,
) {
  return templates
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: Number(bonuses[item.key] ?? 0),
    }))
    .filter((item) => item.value !== 0)
}

export default function EntityDetailsPage({
  rpgId,
  entityType,
  title,
  entityLabel,
  canManage,
  showCategoryField = true,
  current,
  attributeTemplates,
  skillTemplates,
  abilities = [],
  players = [],
  abilityPurchase,
}: Props) {
  const router = useRouter()
  const actions = useEntityDetailsActions({
    rpgId,
    entityType,
    templateKey: current.key,
  })
  const [editorContent, setEditorContent] = useState<JSONContent>(
    (current.catalogMeta.richText.description ??
      EMPTY_RICH_TEXT_DOCUMENT) as JSONContent,
  )
  const [shortDescription, setShortDescription] = useState(
    current.catalogMeta.shortDescription ?? "",
  )
  const [name, setName] = useState(current.label)
  const [category, setCategory] = useState(current.category)
  const [attributeBonuses, setAttributeBonuses] = useState<BonusInputRecord>(
    current.attributeBonuses,
  )
  const [skillBonuses, setSkillBonuses] = useState<BonusInputRecord>(
    current.skillBonuses,
  )
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [contentEditing, setContentEditing] = useState(false)
  const [syncDescriptionToEditor, setSyncDescriptionToEditor] = useState(
    !current.catalogMeta.richText.description,
  )
  const [saving, setSaving] = useState(false)
  const [configStage, setConfigStage] =
    useState<EntityDetailsConfigStage>("basic")
  const configModalRef = useModalFocusTrap(configModalOpen, setConfigModalOpen)

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(["geral", category, current.category].filter(Boolean)),
      ),
    [category, current.category],
  )
  const activeAttributeBonuses = useMemo(
    () => getActiveBonuses(attributeTemplates, attributeBonuses),
    [attributeBonuses, attributeTemplates],
  )
  const activeSkillBonuses = useMemo(
    () => getActiveBonuses(skillTemplates, skillBonuses),
    [skillBonuses, skillTemplates],
  )

  function openConfigModal() {
    setConfigStage("basic")
    setConfigModalOpen(true)
  }

  function handleShortDescriptionChange(value: string) {
    setShortDescription(value)
    if (syncDescriptionToEditor) {
      setEditorContent(createRichTextDocumentFromText(value) as JSONContent)
    }
  }

  async function handleSave() {
    if (!canManage || saving) return

    setSaving(true)
    const loadingToastId = toast.loading("Salvando...")
    try {
      const nextTemplate: EntityCatalogTemplateRecord = {
        ...current,
        label: name.trim(),
        category: category.trim() || "geral",
        attributeBonuses: parseBonusRecord(attributeBonuses),
        skillBonuses: parseBonusRecord(skillBonuses),
        catalogMeta: {
          ...current.catalogMeta,
          shortDescription: shortDescription.trim() || null,
          richText: {
            ...current.catalogMeta.richText,
            description: editorContent,
          },
        },
      }

      await actions.saveTemplate(nextTemplate)
      toast.success(`${entityLabel} salva com sucesso.`)
      setConfigModalOpen(false)
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Erro ao salvar.")
    } finally {
      dismissToast(loadingToastId)
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>{title}</p>
          <h1 className={styles.title}>{name}</h1>
          {shortDescription ? (
            <p className={styles.subtitle}>{shortDescription}</p>
          ) : null}
        </div>

        {canManage ? (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={
                contentEditing ? styles.primaryButton : styles.ghostButton
              }
              onClick={() =>
                setContentEditing((currentValue) => {
                  const nextValue = !currentValue
                  if (nextValue) setSyncDescriptionToEditor(false)
                  return nextValue
                })
              }
              aria-label={
                contentEditing ? "Parar edicao de conteudo" : "Editar conteudo"
              }
              title={contentEditing ? "Parar edicao" : "Digitar"}
            >
              <Keyboard size={16} />
            </button>

            <button
              type="button"
              className={styles.ghostButton}
              onClick={openConfigModal}
              aria-label="Abrir configuracoes"
              title="Configurar"
            >
              <SlidersHorizontal size={16} />
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void handleSave()}
              disabled={saving}
              aria-label={saving ? "Salvando" : "Salvar"}
              title={saving ? "Salvando..." : "Salvar"}
            >
              <Save size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <EntityDetailsContent
        rpgId={rpgId}
        canManage={canManage}
        contentEditing={contentEditing}
        editorContent={editorContent}
        onEditorContentChange={setEditorContent}
        abilities={abilities}
        players={players}
        abilityPurchase={abilityPurchase}
        attributeBonuses={activeAttributeBonuses}
        skillBonuses={activeSkillBonuses}
      />

      <EntityDetailsConfigModal
        open={configModalOpen}
        modalRef={configModalRef}
        entityLabel={entityLabel}
        currentKey={current.key}
        showCategoryField={showCategoryField}
        stage={configStage}
        setStage={setConfigStage}
        name={name}
        setName={setName}
        category={category}
        setCategory={setCategory}
        categoryOptions={categoryOptions}
        shortDescription={shortDescription}
        onShortDescriptionChange={handleShortDescriptionChange}
        attributeTemplates={attributeTemplates}
        skillTemplates={skillTemplates}
        attributeBonuses={attributeBonuses}
        setAttributeBonuses={setAttributeBonuses}
        skillBonuses={skillBonuses}
        setSkillBonuses={setSkillBonuses}
        saving={saving}
        onSave={() => void handleSave()}
        onClose={() => setConfigModalOpen(false)}
      />
    </main>
  )
}
