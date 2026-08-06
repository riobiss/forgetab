"use client"

import type { Dispatch, RefObject, SetStateAction } from "react"
import NumericTemplateGrid from "@/features/world/presentation/components/NumericTemplateGrid"
import type { EntityCatalogTemplateOption } from "@/features/world/catalog/application/types"
import styles from "./EntityDetailsPage.module.css"

export type EntityDetailsConfigStage = "basic" | "attributes" | "skills"

type BonusRecord = Record<string, string | number>

type Props = {
  open: boolean
  modalRef: RefObject<HTMLElement | null>
  entityLabel: string
  currentKey: string
  showCategoryField: boolean
  stage: EntityDetailsConfigStage
  setStage: Dispatch<SetStateAction<EntityDetailsConfigStage>>
  name: string
  setName: Dispatch<SetStateAction<string>>
  category: string
  setCategory: Dispatch<SetStateAction<string>>
  categoryOptions: string[]
  shortDescription: string
  onShortDescriptionChange(value: string): void
  attributeTemplates: EntityCatalogTemplateOption[]
  skillTemplates: EntityCatalogTemplateOption[]
  attributeBonuses: BonusRecord
  setAttributeBonuses: Dispatch<SetStateAction<BonusRecord>>
  skillBonuses: BonusRecord
  setSkillBonuses: Dispatch<SetStateAction<BonusRecord>>
  saving: boolean
  onSave(): void
  onClose(): void
}

export default function EntityDetailsConfigModal({
  open,
  modalRef,
  entityLabel,
  currentKey,
  showCategoryField,
  stage,
  setStage,
  name,
  setName,
  category,
  setCategory,
  categoryOptions,
  shortDescription,
  onShortDescriptionChange,
  attributeTemplates,
  skillTemplates,
  attributeBonuses,
  setAttributeBonuses,
  skillBonuses,
  setSkillBonuses,
  saving,
  onSave,
  onClose
}: Props) {
  if (!open) return null

  const hasAttributeTemplates = attributeTemplates.length > 0
  const hasSkillTemplates = skillTemplates.length > 0
  const selectedTemplates =
    stage === "attributes" ? attributeTemplates : skillTemplates
  const selectedBonuses =
    stage === "attributes" ? attributeBonuses : skillBonuses

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Configurar ${entityLabel.toLowerCase()}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault()
      }}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={styles.modalTitle}>
          Configurar {entityLabel.toLowerCase()}
        </h2>

        <div
          className={styles.stageTabs}
          role="tablist"
          aria-label="Etapas de configuracao"
        >
          <button
            type="button"
            role="tab"
            aria-selected={stage === "basic"}
            className={`${styles.stageTab} ${stage === "basic" ? styles.stageTabActive : ""}`}
            onClick={() => setStage("basic")}
          >
            Basico
          </button>
          {hasAttributeTemplates ? (
            <button
              type="button"
              role="tab"
              aria-selected={stage === "attributes"}
              className={`${styles.stageTab} ${stage === "attributes" ? styles.stageTabActive : ""}`}
              onClick={() => setStage("attributes")}
            >
              Atributos
            </button>
          ) : null}
          {hasSkillTemplates ? (
            <button
              type="button"
              role="tab"
              aria-selected={stage === "skills"}
              className={`${styles.stageTab} ${stage === "skills" ? styles.stageTabActive : ""}`}
              onClick={() => setStage("skills")}
            >
              Pericias
            </button>
          ) : null}
        </div>

        {stage === "basic" ? (
          <>
            <label className={styles.field}>
              <span>Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            {showCategoryField ? (
              <label className={styles.field}>
                <span>Categoria</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
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
                className={styles.descriptionTextarea}
                rows={4}
                value={shortDescription}
                onChange={(event) =>
                  onShortDescriptionChange(event.target.value)
                }
              />
            </label>
          </>
        ) : (
          <NumericTemplateGrid
            items={selectedTemplates.map((item) => ({
              key: item.key,
              label: item.label
            }))}
            values={selectedBonuses}
            onChange={(key, value) =>
              stage === "attributes"
                ? setAttributeBonuses((current) => ({
                    ...current,
                    [key]: value
                  }))
                : setSkillBonuses((current) => ({
                    ...current,
                    [key]: value
                  }))
            }
            gridClassName={styles.grid}
            fieldClassName={styles.field}
            keyPrefix={`${currentKey}-${stage}`}
          />
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={onClose}
            disabled={saving}
          >
            Fechar
          </button>
        </div>
      </section>
    </div>
  )
}
