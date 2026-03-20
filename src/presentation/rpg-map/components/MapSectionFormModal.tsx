"use client"

import { Plus, Trash2, X } from "lucide-react"
import type { RefObject } from "react"
import type { RpgMapSectionDto } from "@/application/rpgMap/types"
import styles from "../RpgMapPage.module.css"

type SectionFormState = {
  name: string
  description: string
  type: string
  parentSectionId: string
  aboutLink: string
  linkedMarkerId: string
  customFields: Array<{ id: string; name: string; value: string }>
}

type MarkerLinkOption = {
  id: string
  name: string
}

type Props = {
  isOpen: boolean
  modalRef: RefObject<HTMLElement | null>
  sectionNameInputId: string
  sectionNameInputRef: RefObject<HTMLInputElement | null>
  editingSection: RpgMapSectionDto | null
  sectionForm: SectionFormState
  sectionFormError: string
  saving: boolean
  parentOptions: Array<{ id: string; label: string }>
  markerOptions: MarkerLinkOption[]
  onChangeForm: (updater: (current: SectionFormState) => SectionFormState) => void
  onOpenCustomFieldModal: () => void
  onSave: () => void
  onClose: () => void
  onDelete: (section: RpgMapSectionDto) => void
}

export function MapSectionFormModal({
  isOpen,
  modalRef,
  sectionNameInputId,
  sectionNameInputRef,
  editingSection,
  sectionForm,
  sectionFormError,
  saving,
  parentOptions,
  markerOptions,
  onChangeForm,
  onOpenCustomFieldModal,
  onSave,
  onClose,
  onDelete,
}: Props) {
  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Salvar secao">
      <section ref={modalRef} className={`${styles.modal} ${styles.sectionModal}`} tabIndex={-1}>
        <div className={styles.panelHeader}>
          <h2>{editingSection ? "Editar secao" : "Criar secao"}</h2>
          {editingSection?.canDelete ? (
            <button
              type="button"
              className={styles.iconButtonDanger}
              onClick={() => onDelete(editingSection)}
              aria-label="Deletar secao"
              title="Deletar secao"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
        <label className={styles.field}>
          <span>Nome</span>
          <input
            id={sectionNameInputId}
            ref={sectionNameInputRef}
            value={sectionForm.name}
            onChange={(event) => onChangeForm((current) => ({ ...current, name: event.target.value }))}
            placeholder={sectionForm.linkedMarkerId ? "Opcional se houver marcador vinculado" : ""}
          />
        </label>
        <label className={styles.field}>
          <span>Descricao</span>
          <textarea
            rows={3}
            value={sectionForm.description}
            onChange={(event) => onChangeForm((current) => ({ ...current, description: event.target.value }))}
          />
        </label>
        <label className={styles.field}>
          <span>Tipo</span>
          <input
            value={sectionForm.type}
            onChange={(event) => onChangeForm((current) => ({ ...current, type: event.target.value }))}
            placeholder="city, base, biome..."
          />
        </label>
        <label className={styles.field}>
          <span>Onde ela aparece</span>
          <select
            value={sectionForm.parentSectionId}
            onChange={(event) => onChangeForm((current) => ({ ...current, parentSectionId: event.target.value }))}
          >
            <option value="">No nivel principal</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Sobre</span>
          <input
            value={sectionForm.aboutLink}
            onChange={(event) => onChangeForm((current) => ({ ...current, aboutLink: event.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label className={styles.field}>
          <span>Vincular marcador</span>
          <select
            value={sectionForm.linkedMarkerId}
            onChange={(event) => onChangeForm((current) => ({ ...current, linkedMarkerId: event.target.value }))}
          >
            <option value="">Nenhum marcador</option>
            {markerOptions.map((marker) => (
              <option key={marker.id} value={marker.id}>
                {marker.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.field}>
          <div className={styles.customFieldsHeader}>
            <span>Campos customizados</span>
            <button type="button" className={styles.secondaryButton} onClick={onOpenCustomFieldModal}>
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
                      onChangeForm((current) => ({
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
                      onChangeForm((current) => ({
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
                      onChangeForm((current) => ({
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
          <button type="button" className={styles.primaryButton} onClick={onSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}
