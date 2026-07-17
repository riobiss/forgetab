"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { LoaderCircle, Plus, X } from "lucide-react"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import { itemRarityLabel, itemTypeLabel } from "@/shared/items/itemLabels"
import styles from "./ItemsDashboardClient.module.css"

type NamedDescription = {
  name: string
  description: string
}

type CustomField = {
  id: string
  name: string
  value: string
}

type ItemUpsertModalProps = {
  open: boolean
  mode: "create" | "edit"
  tab: "basic" | "requirements" | "abilities" | "effects"
  setTab: Dispatch<SetStateAction<"basic" | "requirements" | "abilities" | "effects">>
  loading: boolean
  saving: boolean
  error: string
  uploadError: string
  name: string
  setName: Dispatch<SetStateAction<string>>
  description: string
  setDescription: Dispatch<SetStateAction<string>>
  preRequirement: string
  setPreRequirement: Dispatch<SetStateAction<string>>
  type: string
  setType: (value: string) => void
  rarity: string
  setRarity: (value: string) => void
  damage: string
  setDamage: Dispatch<SetStateAction<string>>
  range: string
  setRange: Dispatch<SetStateAction<string>>
  weight: string
  setWeight: Dispatch<SetStateAction<string>>
  duration: string
  setDuration: Dispatch<SetStateAction<string>>
  durability: string
  setDurability: Dispatch<SetStateAction<string>>
  abilities: NamedDescription[]
  setAbilities: Dispatch<SetStateAction<NamedDescription[]>>
  effects: NamedDescription[]
  setEffects: Dispatch<SetStateAction<NamedDescription[]>>
  customFields: CustomField[]
  setCustomFields: Dispatch<SetStateAction<CustomField[]>>
  image: string
  selectedImageFile: File | null
  selectedImagePreviewUrl: string
  uploadingImage: boolean
  customFieldModalOpen: boolean
  setCustomFieldModalOpen: Dispatch<SetStateAction<boolean>>
  newCustomFieldName: string
  setNewCustomFieldName: Dispatch<SetStateAction<string>>
  newCustomFieldValue: string
  setNewCustomFieldValue: Dispatch<SetStateAction<string>>
  baseItemTypeValues: readonly string[]
  baseItemRarityValues: readonly string[]
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
  onImageUpload: (file: File) => void
  onRemoveImage: () => void
  onAddCustomField: () => void
  updateNamedEntry: (
    list: NamedDescription[],
    index: number,
    field: keyof NamedDescription,
    value: string,
  ) => NamedDescription[]
  createEmptyNamedDescription: () => NamedDescription
}

export function ItemUpsertModal({
  open,
  mode,
  tab,
  setTab,
  loading,
  saving,
  error,
  uploadError,
  name,
  setName,
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
  image,
  selectedImageFile,
  selectedImagePreviewUrl,
  uploadingImage,
  customFieldModalOpen,
  setCustomFieldModalOpen,
  newCustomFieldName,
  setNewCustomFieldName,
  newCustomFieldValue,
  setNewCustomFieldValue,
  baseItemTypeValues,
  baseItemRarityValues,
  onClose,
  onSave,
  onDelete,
  onImageUpload,
  onRemoveImage,
  onAddCustomField,
  updateNamedEntry,
  createEmptyNamedDescription,
}: ItemUpsertModalProps) {
  const title = mode === "edit" ? "Editar" : "Criar"
  const modalRef = useRef<HTMLElement | null>(null)
  const nestedModalRef = useRef<HTMLElement | null>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)
  const [showImagePreview, setShowImagePreview] = useState(true)

  useEffect(() => {
    if (!open) {
      return
    }

    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  }, [open])

  useEffect(() => {
    if (!open) {
      previousFocusedElementRef.current?.focus()
      return
    }

    const activeModal = customFieldModalOpen ? nestedModalRef.current : modalRef.current
    if (!activeModal) {
      return
    }

    function isAllowedFocusTarget(target: EventTarget | null, currentModal: HTMLElement) {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      if (currentModal.contains(target)) {
        return true
      }

      return Boolean(
        target.closest("[data-radix-popper-content-wrapper]") ||
        target.closest('[role="listbox"]'),
      )
    }

    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "[role='combobox']:not([aria-disabled='true'])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ")

    const getFocusableElements = () =>
      Array.from(activeModal.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
      )

    const initialFocusTarget = getFocusableElements()[0] ?? activeModal
    queueMicrotask(() => {
      initialFocusTarget.focus()
    })

    function handleFocusIn(event: FocusEvent) {
      const currentModal = customFieldModalOpen ? nestedModalRef.current : modalRef.current
      if (!currentModal) {
        return
      }

      if (isAllowedFocusTarget(event.target, currentModal)) {
        return
      }

      const firstFocusableElement = Array.from(
        currentModal.querySelectorAll<HTMLElement>(focusableSelectors),
      ).find((element) => !element.hasAttribute("disabled"))

      firstFocusableElement?.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") {
        return
      }

      const currentModal = customFieldModalOpen ? nestedModalRef.current : modalRef.current
      if (!currentModal) {
        return
      }

      const focusableElements = Array.from(
        currentModal.querySelectorAll<HTMLElement>(focusableSelectors),
      ).filter((element) => !element.hasAttribute("disabled"))

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
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [customFieldModalOpen, open])

  useEffect(() => {
    if (!open) {
      return
    }

    setShowImagePreview(true)
  }, [open, image, selectedImagePreviewUrl])

  if (!open) return null

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} item`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault()
        }
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
              onClick={() => setCustomFieldModalOpen(true)}
              aria-label="Novo campo"
              title="Novo campo"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              className={styles.modalIconButton}
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.stepper}>
          {[
            { key: "basic", label: "Basico" },
            { key: "requirements", label: "Requerimentos" },
            { key: "abilities", label: "Habilidades" },
            { key: "effects", label: "Efeitos" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? styles.stepActive : styles.step}
              onClick={() => setTab(item.key as "basic" | "requirements" | "abilities" | "effects")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.formDivider} aria-hidden="true" />

        {loading ? (
          <p className={styles.feedback}>Carregando item...</p>
        ) : (
          <>
            {tab === "basic" ? (
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Imagem do item</span>
                  <div className={styles.imageActions}>
                    <label htmlFor="item-image-file" className={styles.ghostButton}>
                      {uploadingImage ? "Enviando..." : selectedImageFile ? "Trocar imagem" : "Adicionar imagem"}
                    </label>
                    {image || selectedImageFile ? (
                      <>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => setShowImagePreview((prev) => !prev)}
                        >
                          {showImagePreview ? "Ocultar preview" : "Mostrar preview"}
                        </button>
                        <button type="button" className={styles.removeButton} onClick={onRemoveImage} disabled={saving || uploadingImage}>
                          Remover imagem
                        </button>
                      </>
                    ) : null}
                  </div>
                  <input
                    id="item-image-file"
                    className={styles.fileInput}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        onImageUpload(file)
                      }
                    }}
                    disabled={saving || uploadingImage}
                  />
                </label>

                {(selectedImagePreviewUrl || image) && showImagePreview ? (
                  <div className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Preview</span>
                    <div className={styles.itemImagePreviewFrame}>
                      <Image
                        src={selectedImagePreviewUrl || image}
                        alt={`Imagem de ${name || "item"}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        unoptimized
                        className={styles.itemImagePreview}
                      />
                    </div>
                  </div>
                ) : null}

                <label className={styles.field}>
                  <span>Nome</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
                </label>

                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Descricao</span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Descricao opcional do item"
                  />
                </label>

                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Tipo</span>
                  <NativeSelectField value={type} onChange={(event) => setType(event.target.value)}>
                    {baseItemTypeValues.map((option) => (
                      <option key={option} value={option}>
                        {itemTypeLabel[option as keyof typeof itemTypeLabel] ?? option}
                      </option>
                    ))}
                  </NativeSelectField>
                </label>

                <label className={styles.field}>
                  <span>Raridade</span>
                  <NativeSelectField value={rarity} onChange={(event) => setRarity(event.target.value)}>
                    {baseItemRarityValues.map((option) => (
                      <option key={option} value={option}>
                        {itemRarityLabel[option as keyof typeof itemRarityLabel] ?? option}
                      </option>
                    ))}
                  </NativeSelectField>
                </label>

                <label className={styles.field}>
                  <span>Dano</span>
                  <input value={damage} onChange={(event) => setDamage(event.target.value)} placeholder="Ex: 1d6 + 2" />
                </label>

                <label className={styles.field}>
                  <span>Alcance</span>
                  <input value={range} onChange={(event) => setRange(event.target.value)} placeholder="Ex: 9m" />
                </label>

                <label className={styles.field}>
                  <span>Peso</span>
                  <input type="number" min={0} step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} />
                </label>

                <label className={styles.field}>
                  <span>Duracao</span>
                  <input value={duration} onChange={(event) => setDuration(event.target.value)} />
                </label>

                <label className={styles.field}>
                  <span>Durabilidade</span>
                  <input type="number" min={0} step={1} value={durability} onChange={(event) => setDurability(event.target.value)} />
                </label>

                {customFields.length > 0 ? (
                  <div className={`${styles.editorSection} ${styles.spanTwo}`}>
                    <h4>Campos extras</h4>
                    <div className={styles.formGrid}>
                      {customFields.map((field) => (
                        <label key={field.id} className={styles.field}>
                          <span>{field.name}</span>
                          <div className={styles.customFieldRow}>
                            <input
                              value={field.value}
                              onChange={(event) =>
                                setCustomFields((prev) =>
                                  prev.map((item) =>
                                    item.id === field.id ? { ...item, value: event.target.value } : item,
                                  ),
                                )
                              }
                            />
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => setCustomFields((prev) => prev.filter((item) => item.id !== field.id))}
                            >
                              Remover
                            </button>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "requirements" ? (
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Pre-Requisito</span>
                  <textarea
                    rows={3}
                    value={preRequirement}
                    onChange={(event) => setPreRequirement(event.target.value)}
                    placeholder="Ex: Nivel 10, Forca 15"
                  />
                </label>
              </div>
            ) : null}

            {tab === "abilities" ? (
              <div className={styles.formGrid}>
                <div className={`${styles.editorSection} ${styles.spanTwo}`}>
                  <h4>Habilidades</h4>
                  <div className={styles.multiCard}>
                    <label className={styles.field}>
                      <span>Nome da habilidade</span>
                      <input
                        value={abilities[0]?.name ?? ""}
                        onChange={(event) =>
                          setAbilities((prev) =>
                            updateNamedEntry(
                              prev.length > 0 ? prev : [createEmptyNamedDescription()],
                              0,
                              "name",
                              event.target.value,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Habilidade</span>
                      <textarea
                        rows={3}
                        value={abilities[0]?.description ?? ""}
                        onChange={(event) =>
                          setAbilities((prev) =>
                            updateNamedEntry(
                              prev.length > 0 ? prev : [createEmptyNamedDescription()],
                              0,
                              "description",
                              event.target.value,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "effects" ? (
              <div className={styles.formGrid}>
                <div className={`${styles.editorSection} ${styles.spanTwo}`}>
                  <h4>Efeitos</h4>
                  <div className={styles.multiCard}>
                    <label className={styles.field}>
                      <span>Nome do efeito</span>
                      <input
                        value={effects[0]?.name ?? ""}
                        onChange={(event) =>
                          setEffects((prev) =>
                            updateNamedEntry(
                              prev.length > 0 ? prev : [createEmptyNamedDescription()],
                              0,
                              "name",
                              event.target.value,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Efeito</span>
                      <textarea
                        rows={3}
                        value={effects[0]?.description ?? ""}
                        onChange={(event) =>
                          setEffects((prev) =>
                            updateNamedEntry(
                              prev.length > 0 ? prev : [createEmptyNamedDescription()],
                              0,
                              "description",
                              event.target.value,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}
        {uploadError && uploadError !== error ? <p className={styles.error}>{uploadError}</p> : null}

        <div className={styles.formActions}>
          {mode === "edit" && onDelete ? (
            <button type="button" className={styles.dangerButton} onClick={onDelete} disabled={saving || loading}>
              Remover
            </button>
          ) : null}
          <button type="button" className={styles.primaryButton} onClick={onSave} disabled={saving || loading}>
            {saving ? <LoaderCircle size={16} className={styles.iconSpin} /> : null}
            <span>{saving ? "Salvando..." : mode === "edit" ? "Salvar" : "Criar"}</span>
          </button>
        </div>

        {customFieldModalOpen ? (
          <div
            className={styles.nestedModalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Novo campo"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setCustomFieldModalOpen(false)
              }
            }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                event.preventDefault()
              }
            }}
          >
            <section
              ref={nestedModalRef}
              className={styles.nestedModalCard}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              tabIndex={-1}
            >
              <h3>Novo campo</h3>
              <label className={styles.field}>
                <span>Nome</span>
                <input value={newCustomFieldName} onChange={(event) => setNewCustomFieldName(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Valor</span>
                <input value={newCustomFieldValue} onChange={(event) => setNewCustomFieldValue(event.target.value)} />
              </label>
              <div className={styles.formActions}>
                <button type="button" className={styles.ghostButton} onClick={() => setCustomFieldModalOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className={styles.primaryButton} onClick={onAddCustomField}>
                  Criar campo
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}
