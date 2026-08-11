"use client"

import { useCallback, useRef } from "react"
import { LoaderCircle, Plus, X } from "lucide-react"
import { useModalFocusTrap } from "@/shared/presentation/hooks/useModalFocusTrap"
import { ItemBasicFields } from "./ItemBasicFields"
import { ItemCustomFieldModal } from "./ItemCustomFieldModal"
import { ItemNamedDescriptionFields } from "./ItemNamedDescriptionFields"
import type { ItemEditorTab, ItemUpsertModalProps } from "./itemEditorTypes"
import styles from "./ItemsDashboardClient.module.css"

const editorTabs = [
  { key: "basic", label: "Basico" },
  { key: "requirements", label: "Requerimentos" },
  { key: "abilities", label: "Habilidades" },
  { key: "effects", label: "Efeitos" }
] satisfies ReadonlyArray<{ key: ItemEditorTab; label: string }>

export function ItemUpsertModal(props: ItemUpsertModalProps) {
  const title = props.mode === "edit" ? "Editar" : "Criar"
  const modalRef = useRef<HTMLElement | null>(null)
  const nestedModalRef = useRef<HTMLElement | null>(null)
  const getActiveModalElement = useCallback(
    () =>
      props.customFieldModalOpen ? nestedModalRef.current : modalRef.current,
    [props.customFieldModalOpen]
  )

  useModalFocusTrap({
    isActive: props.open,
    activeElement: getActiveModalElement
  })

  if (!props.open) return null

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} item`}
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault()
      }}
    >
      <section
        ref={modalRef}
        className={`${styles.modal} ${styles.editorModal}`}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <h3>{title}</h3>
          </div>
          <div className={styles.modalHeaderActions}>
            <button
              type="button"
              className={styles.modalIconButton}
              onClick={() => props.setCustomFieldModalOpen(true)}
              aria-label="Novo campo"
              title="Novo campo"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              className={styles.modalIconButton}
              onClick={props.onClose}
              aria-label="Fechar"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.stepper}>
          {editorTabs.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                props.tab === item.key ? styles.stepActive : styles.step
              }
              onClick={() => props.setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.formDivider} aria-hidden="true" />

        {props.loading ? (
          <p className={styles.feedback}>Carregando item...</p>
        ) : (
          <>
            {props.tab === "basic" ? <ItemBasicFields {...props} /> : null}
            {props.tab === "requirements" ? (
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Pre-Requisito</span>
                  <textarea
                    rows={3}
                    value={props.preRequirement}
                    onChange={(event) =>
                      props.setPreRequirement(event.target.value)
                    }
                    placeholder="Ex: Nivel 10, Forca 15"
                  />
                </label>
              </div>
            ) : null}
            {props.tab === "abilities" ? (
              <ItemNamedDescriptionFields
                title="Habilidades"
                nameLabel="Nome da habilidade"
                descriptionLabel="Habilidade"
                entries={props.abilities}
                setEntries={props.setAbilities}
                updateNamedEntry={props.updateNamedEntry}
                createEmptyNamedDescription={props.createEmptyNamedDescription}
              />
            ) : null}
            {props.tab === "effects" ? (
              <ItemNamedDescriptionFields
                title="Efeitos"
                nameLabel="Nome do efeito"
                descriptionLabel="Efeito"
                entries={props.effects}
                setEntries={props.setEffects}
                updateNamedEntry={props.updateNamedEntry}
                createEmptyNamedDescription={props.createEmptyNamedDescription}
              />
            ) : null}
          </>
        )}

        {props.error ? <p className={styles.error}>{props.error}</p> : null}
        {props.uploadError && props.uploadError !== props.error ? (
          <p className={styles.error}>{props.uploadError}</p>
        ) : null}

        <div className={styles.formActions}>
          {props.mode === "edit" && props.onDelete ? (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={props.onDelete}
              disabled={props.saving || props.loading}
            >
              Remover
            </button>
          ) : null}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={props.onSave}
            disabled={props.saving || props.loading}
          >
            {props.saving ? (
              <LoaderCircle size={16} className={styles.iconSpin} />
            ) : null}
            <span>
              {props.saving
                ? "Salvando..."
                : props.mode === "edit"
                  ? "Salvar"
                  : "Criar"}
            </span>
          </button>
        </div>

        {props.customFieldModalOpen ? (
          <ItemCustomFieldModal
            {...props}
            modalRef={nestedModalRef}
            onClose={() => props.setCustomFieldModalOpen(false)}
          />
        ) : null}
      </section>
    </div>
  )
}
