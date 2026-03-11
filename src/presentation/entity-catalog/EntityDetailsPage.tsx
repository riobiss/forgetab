"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { JSONContent } from "@tiptap/react"
import { Keyboard } from "lucide-react"
import { Save } from "lucide-react"
import { SlidersHorizontal } from "lucide-react"
import type { EntityCatalogAbilityView } from "@/application/entityCatalog/use-cases/entityCatalogAbilities"
import type { EntityCatalogPlayerItem } from "@/application/entityCatalog/types"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"
import {
  createRichTextDocumentFromText,
  EMPTY_RICH_TEXT_DOCUMENT,
} from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType, EntityCatalogMeta } from "@/domain/entityCatalog/types"
import EntityAbilitiesPanel from "./EntityAbilitiesPanel"
import styles from "./EntityDetailsPage.module.css"

type TemplateOption = {
  key: string
  label: string
}

type IdentityTemplateRecord = {
  key: string
  label: string
  category: string
  shortDescription: string | null
  content: JSONContent
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
  catalogMeta: EntityCatalogMeta
  lore?: unknown
}

type Props = {
  rpgId: string
  entityType: CatalogEntityType
  title: string
  entityLabel: string
  canManage: boolean
  showCategoryField?: boolean
  current: IdentityTemplateRecord
  attributeTemplates: TemplateOption[]
  skillTemplates: TemplateOption[]
  abilities?: EntityCatalogAbilityView[]
  players?: EntityCatalogPlayerItem[]
  abilityPurchase?: {
    characterId: string | null
    costsEnabled: boolean
    costResourceName: string
    initialPoints: number
    initialOwnedBySkill: Record<string, number[]>
  }
}

type ConfigStage = "basic" | "attributes" | "skills"
type ContentTab = "content" | "abilities" | "bonuses" | "players"

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
  const [editorContent, setEditorContent] = useState<JSONContent>(
    current.content ?? (EMPTY_RICH_TEXT_DOCUMENT as JSONContent),
  )
  const [shortDescription, setShortDescription] = useState(current.shortDescription ?? "")
  const [name, setName] = useState(current.label)
  const [category, setCategory] = useState(current.category)
  const [attributeBonuses, setAttributeBonuses] = useState(current.attributeBonuses)
  const [skillBonuses, setSkillBonuses] = useState(current.skillBonuses)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [contentEditing, setContentEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ContentTab>("content")
  const [status, setStatus] = useState<{ error: string; success: string }>({
    error: "",
    success: "",
  })
  const [configStage, setConfigStage] = useState<ConfigStage>("basic")

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(["geral", current.category].filter(Boolean)),
      ),
    [current.category],
  )
  const hasAttributeTemplates = attributeTemplates.length > 0
  const hasSkillTemplates = skillTemplates.length > 0
  const hasAbilities = abilities.length > 0
  const hasPlayers = players.length > 0
  const activeAttributeBonuses = useMemo(
    () => attributeTemplates
      .map((item) => ({
        key: item.key,
        label: item.label,
        value: Number(attributeBonuses[item.key] ?? 0),
      }))
      .filter((item) => item.value !== 0),
    [attributeBonuses, attributeTemplates],
  )
  const activeSkillBonuses = useMemo(
    () => skillTemplates
      .map((item) => ({
        key: item.key,
        label: item.label,
        value: Number(skillBonuses[item.key] ?? 0),
      }))
      .filter((item) => item.value !== 0),
    [skillBonuses, skillTemplates],
  )
  const hasBonuses = activeAttributeBonuses.length > 0 || activeSkillBonuses.length > 0

  function openBindingsModal() {
    setConfigStage("basic")
    setConfigModalOpen(true)
  }

  async function loadAllTemplates() {
    const endpoint = entityType === "class" ? "classes" : "races"
    const response = await fetch(`/api/rpg/${rpgId}/${endpoint}`)
    const payload = (await response.json()) as {
      classes?: IdentityTemplateRecord[]
      races?: IdentityTemplateRecord[]
      message?: string
    }

    if (!response.ok) {
      throw new Error(payload.message ?? "Nao foi possivel carregar os templates.")
    }

    return entityType === "class" ? payload.classes ?? [] : payload.races ?? []
  }

  async function saveTemplate(nextTemplate: IdentityTemplateRecord) {
    const allTemplates = await loadAllTemplates()
    const endpoint = entityType === "class" ? "classes" : "races"
    const nextTemplates = allTemplates.map((item) =>
      item.key === current.key
        ? {
            ...item,
            label: nextTemplate.label,
            category: nextTemplate.category,
            attributeBonuses: nextTemplate.attributeBonuses,
            skillBonuses: nextTemplate.skillBonuses,
            catalogMeta: nextTemplate.catalogMeta,
            ...(entityType === "race" ? { lore: nextTemplate.lore ?? item.lore } : {}),
          }
        : item,
    )

    const body =
      entityType === "class"
        ? { classes: nextTemplates }
        : { races: nextTemplates }

    const response = await fetch(`/api/rpg/${rpgId}/${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const payload = (await response.json()) as { message?: string }
    if (!response.ok) {
      throw new Error(payload.message ?? "Nao foi possivel salvar.")
    }
  }

  async function handleSave() {
    if (!canManage || saving) return
    setSaving(true)
    setStatus({ error: "", success: "" })

    try {
      const nextTemplate: IdentityTemplateRecord = {
        ...current,
        label: name.trim(),
        category: category.trim() || "geral",
        shortDescription: shortDescription.trim() || null,
        content: editorContent,
        attributeBonuses,
        skillBonuses,
        catalogMeta: {
          ...current.catalogMeta,
          shortDescription: shortDescription.trim() || null,
          richText: {
            ...current.catalogMeta.richText,
            description: editorContent,
          },
        },
      }

      await saveTemplate(nextTemplate)
      setStatus({ error: "", success: `${entityLabel} salva com sucesso.` })
      setConfigModalOpen(false)
    } catch (cause) {
      setStatus({
        error: cause instanceof Error ? cause.message : "Erro ao salvar.",
        success: "",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>{title}</p>
          <h1 className={styles.title}>{name}</h1>
          {shortDescription ? <p className={styles.subtitle}>{shortDescription}</p> : null}
        </div>

        {canManage ? (
          <div className={styles.headerActions}>
            <button
              type="button"
              className={contentEditing ? styles.primaryButton : styles.ghostButton}
              onClick={() => setContentEditing((currentValue) => !currentValue)}
              aria-label={contentEditing ? "Parar edicao de conteudo" : "Editar conteudo"}
              title={contentEditing ? "Parar edicao" : "Digitar"}
            >
              <Keyboard size={16} />
            </button>

            <button
              type="button"
              className={styles.ghostButton}
              onClick={openBindingsModal}
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

      {status.error ? <p className={`${styles.status} ${styles.error}`}>{status.error}</p> : null}
      {status.success ? <p className={`${styles.status} ${styles.success}`}>{status.success}</p> : null}

      <section className={styles.contentShell}>
        <div className={styles.contentTabs} role="tablist" aria-label="Conteudo da entidade">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "content"}
            className={`${styles.contentTab} ${activeTab === "content" ? styles.contentTabActive : ""}`}
            onClick={() => setActiveTab("content")}
          >
            Conteudo
          </button>
          {hasAbilities ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "abilities"}
              className={`${styles.contentTab} ${activeTab === "abilities" ? styles.contentTabActive : ""}`}
              onClick={() => setActiveTab("abilities")}
            >
              Habilidades
            </button>
          ) : null}
          {hasBonuses ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "bonuses"}
              className={`${styles.contentTab} ${activeTab === "bonuses" ? styles.contentTabActive : ""}`}
              onClick={() => setActiveTab("bonuses")}
            >
              Bonus
            </button>
          ) : null}
          {hasPlayers ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "players"}
              className={`${styles.contentTab} ${activeTab === "players" ? styles.contentTabActive : ""}`}
              onClick={() => setActiveTab("players")}
            >
              Jogadores
            </button>
          ) : null}
        </div>

        {activeTab === "content" ? (
          <section className={styles.editorShell}>
            <SimpleEditor
              initialContent={editorContent}
              onJsonChange={setEditorContent}
              disabled={!canManage || !contentEditing}
              className="library-book-editor"
            />
          </section>
        ) : activeTab === "bonuses" ? (
          <section className={styles.abilitiesShell}>
            <div className={styles.bonusGrid}>
              {activeAttributeBonuses.length > 0 ? (
                <section className={styles.bonusCard}>
                  <header className={styles.bonusHeader}>
                    <h2 className={styles.bonusTitle}>Atributos</h2>
                    <span className={styles.bonusCount}>{activeAttributeBonuses.length}</span>
                  </header>
                  <div className={styles.bonusList}>
                    {activeAttributeBonuses.map((item) => (
                      <div key={item.key} className={styles.bonusItem}>
                        <span>{item.label}</span>
                        <strong>{item.value > 0 ? `+${item.value}` : item.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {activeSkillBonuses.length > 0 ? (
                <section className={styles.bonusCard}>
                  <header className={styles.bonusHeader}>
                    <h2 className={styles.bonusTitle}>Pericias</h2>
                    <span className={styles.bonusCount}>{activeSkillBonuses.length}</span>
                  </header>
                  <div className={styles.bonusList}>
                    {activeSkillBonuses.map((item) => (
                      <div key={item.key} className={styles.bonusItem}>
                        <span>{item.label}</span>
                        <strong>{item.value > 0 ? `+${item.value}` : item.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </section>
        ) : activeTab === "players" ? (
          <section className={styles.abilitiesShell}>
            <div className={styles.playerGrid}>
              {players.map((player) => (
                <Link
                  key={player.id}
                  href={`/rpg/${rpgId}/characters/${player.id}`}
                  className={styles.playerCard}
                >
                  <div className={styles.playerAvatar}>
                    {player.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.image} alt={player.name} />
                    ) : (
                      <span>{player.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.playerMeta}>
                    <strong>{player.name}</strong>
                    <span>Player</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className={styles.abilitiesShell}>
            <EntityAbilitiesPanel skills={abilities} purchase={abilityPurchase} />
          </section>
        )}
      </section>

      {configModalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <section className={styles.modal}>
            <h2 className={styles.modalTitle}>Configurar {entityLabel.toLowerCase()}</h2>

            <div className={styles.stageTabs} role="tablist" aria-label="Etapas de configuracao">
              <button
                type="button"
                role="tab"
                aria-selected={configStage === "basic"}
                className={`${styles.stageTab} ${configStage === "basic" ? styles.stageTabActive : ""}`}
                onClick={() => setConfigStage("basic")}
              >
                Basico
              </button>
              {hasAttributeTemplates ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={configStage === "attributes"}
                  className={`${styles.stageTab} ${configStage === "attributes" ? styles.stageTabActive : ""}`}
                  onClick={() => setConfigStage("attributes")}
                >
                  Atributos
                </button>
              ) : null}
              {hasSkillTemplates ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={configStage === "skills"}
                  className={`${styles.stageTab} ${configStage === "skills" ? styles.stageTabActive : ""}`}
                  onClick={() => setConfigStage("skills")}
                >
                  Pericias
                </button>
              ) : null}
            </div>

            {configStage === "basic" ? (
              <>
                <label className={styles.field}>
                  <span>Nome</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} />
                </label>

                {showCategoryField ? (
                  <label className={styles.field}>
                    <span>Categoria</span>
                    <select value={category} onChange={(event) => setCategory(event.target.value)}>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className={styles.field}>
                  <span>Descricao basica</span>
                  <textarea
                    rows={4}
                    value={shortDescription}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setShortDescription(nextValue)
                      if (!current.catalogMeta.richText.description) {
                        setEditorContent(createRichTextDocumentFromText(nextValue) as JSONContent)
                      }
                    }}
                  />
                </label>
              </>
            ) : (
              <NumericTemplateGrid
                items={(configStage === "attributes" ? attributeTemplates : skillTemplates).map((item) => ({
                  key: item.key,
                  label: item.label,
                }))}
                values={configStage === "attributes" ? attributeBonuses : skillBonuses}
                onChange={(key, value) =>
                  configStage === "attributes"
                    ? setAttributeBonuses((prev) => ({ ...prev, [key]: Number(value) }))
                    : setSkillBonuses((prev) => ({ ...prev, [key]: Number(value) }))
                }
                gridClassName={styles.grid}
                fieldClassName={styles.field}
                keyPrefix={`${current.key}-${configStage}`}
              />
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.primaryButton} onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => setConfigModalOpen(false)} disabled={saving}>
                Fechar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
