"use client"

import Image from "next/image"
import { Plus, Trash2, X } from "lucide-react"
import type { RefObject } from "react"
import { TypedCustomFieldEditor } from "@/components/custom-fields/TypedCustomFieldEditor"
import type { RpgMapSectionDto } from "@/application/rpgMap/types"
import type { SectionFormState } from "@/presentation/rpg-map/hooks/useRpgMapSectionModalState"
import styles from "../RpgMapPage.module.css"

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
  sectionImageUploading: boolean
  parentOptions: Array<{ id: string; label: string }>
  markerOptions: MarkerLinkOption[]
  onChangeForm: (updater: (current: SectionFormState) => SectionFormState) => void
  onOpenCustomFieldModal: () => void
  onAddImage: () => void
  onRemoveImage: (imageUrl: string) => void
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
  sectionImageUploading,
  parentOptions,
  markerOptions,
  onChangeForm,
  onOpenCustomFieldModal,
  onAddImage,
  onRemoveImage,
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
          <div className={styles.inlineActions}>
            <button type="button" className={styles.secondaryButton} onClick={onOpenCustomFieldModal}>
              <Plus size={14} />
              <span>Adicionar campo</span>
            </button>
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
            <span>Imagens</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onAddImage}
              disabled={sectionImageUploading || sectionForm.images.length >= 5}
            >
              <Plus size={14} />
              <span>{sectionImageUploading ? "Enviando..." : "Adicionar imagem"}</span>
            </button>
          </div>
          {sectionForm.images.length > 0 ? (
            <div className={styles.sectionImageEditorGrid}>
              {sectionForm.images.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className={styles.sectionImageEditorCard}>
                  <div className={styles.sectionImageEditorPreview}>
                    <Image
                      src={imageUrl}
                      alt={`Imagem ${index + 1} da secao`}
                      fill
                      sizes="160px"
                      unoptimized
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.iconButtonDanger}
                    onClick={() => onRemoveImage(imageUrl)}
                    disabled={sectionImageUploading}
                    aria-label="Remover imagem"
                    title="Remover imagem"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.feedback}>Nenhuma imagem adicionada.</p>
          )}
        </div>
        <div className={styles.field}>
          <div className={styles.customFieldsHeader}>
            <span>Campos customizados</span>
          </div>
          {sectionForm.customFields.length > 0 ? (
            <div className={styles.customFieldsEditor}>
              {sectionForm.customFields.map((field) => (
                <div key={field.id} className={styles.customFieldEditorRow}>
                  <TypedCustomFieldEditor
                    field={field}
                    layout="inline"
                    keyEditable={false}
                    onChange={(updater) =>
                      onChangeForm((current) => ({
                        ...current,
                        customFields: current.customFields.map((item) =>
                          item.id === field.id
                            ? {
                                ...item,
                                ...updater({
                                  key: item.key,
                                  value: item.value,
                                  type: item.type,
                                }),
                              }
                            : item,
                        ),
                      }))
                    }
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
