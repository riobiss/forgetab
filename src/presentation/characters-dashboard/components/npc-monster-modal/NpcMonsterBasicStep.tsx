"use client"

import { ImagePlus, Trash2 } from "lucide-react"
import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"
import { ReactMultiSelectField } from "@/components/select/ReactMultiSelectField"
import { ReactSelectField } from "@/components/select/ReactSelectField"
import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import type { CharacterEditorBootstrapDto } from "@/application/charactersEditor/types"
import styles from "../../CharactersDashboardPage.module.css"
import { narrativeStatusOptions, visibilityOptions } from "./constants"
import type { ExtraField, NarrativeStatus, NumericInputValue, SecretFieldKey } from "./types"

type Props = {
  bootstrap: CharacterEditorBootstrapDto | null
  image: string
  imageStatusText: string
  selectedImageName: string
  name: string
  titleNickname: string
  description: string
  visibility: "private" | "public"
  narrativeStatus: NarrativeStatus
  secretFieldKeys: SecretFieldKey[]
  secretFieldOptions: ReactSelectOption[]
  raceLabel: string
  classLabel: string
  statusValues: Record<string, NumericInputValue>
  extraFields: ExtraField[]
  onImageSelect: (file: File) => void
  onImageRemove: () => void
  onNameChange: (value: string) => void
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onVisibilityChange: (value: "private" | "public") => void
  onNarrativeStatusChange: (value: NarrativeStatus) => void
  onSecretFieldKeysChange: (values: SecretFieldKey[]) => void
  onRaceChange: (value: string) => void
  onClassChange: (value: string) => void
  onStatusChange: (key: string, value: string) => void
  onExtraFieldValueChange: (fieldId: string, value: string) => void
  onRemoveExtraField: (fieldId: string) => void
  onResetError: () => void
}

export default function NpcMonsterBasicStep({
  bootstrap,
  image,
  imageStatusText,
  selectedImageName,
  name,
  titleNickname,
  description,
  visibility,
  narrativeStatus,
  secretFieldKeys,
  secretFieldOptions,
  raceLabel,
  classLabel,
  statusValues,
  extraFields,
  onImageSelect,
  onImageRemove,
  onNameChange,
  onTitleChange,
  onDescriptionChange,
  onVisibilityChange,
  onNarrativeStatusChange,
  onSecretFieldKeysChange,
  onRaceChange,
  onClassChange,
  onStatusChange,
  onExtraFieldValueChange,
  onRemoveExtraField,
  onResetError,
}: Props) {
  return (
    <div className={styles.modalBody}>
      <div className={styles.modalGrid}>
        <label className={styles.modalField}>
          <span>Image</span>
          <div className={styles.modalUploadRow}>
            <label htmlFor="npc-monster-image" className={styles.modalUploadButton}>
              <ImagePlus size={16} />
              <span>Selecionar imagem</span>
            </label>
            {image || selectedImageName ? (
              <button
                type="button"
                className={styles.modalIconButton}
                onClick={onImageRemove}
                aria-label="Remover imagem"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
          <input
            id="npc-monster-image"
            className={styles.modalHiddenInput}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }

              onImageSelect(file)
              onResetError()
            }}
          />
          {imageStatusText ? <p className={styles.modalHint}>{imageStatusText}</p> : null}
        </label>

        <label className={styles.modalField}>
          <span>Nome</span>
          <input value={name} onChange={(event) => onNameChange(event.target.value)} required />
        </label>

        <label className={styles.modalField}>
          <span>Titulo / Apelido</span>
          <input value={titleNickname} onChange={(event) => onTitleChange(event.target.value)} />
        </label>

        <label className={`${styles.modalField} ${styles.modalFieldWide}`}>
          <span>Description</span>
          <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} rows={4} />
        </label>

        <div className={styles.modalField}>
          <ReactSelectField
            label="Visibilidade para os membros"
            options={visibilityOptions}
            value={visibilityOptions.find((option) => option.value === visibility) ?? null}
            onChange={(option) => onVisibilityChange((option?.value as "public" | "private") ?? "public")}
          />
        </div>

        <div className={styles.modalField}>
          <ReactSelectField
            label="Status"
            options={narrativeStatusOptions}
            value={narrativeStatusOptions.find((option) => option.value === narrativeStatus) ?? null}
            onChange={(option) =>
              onNarrativeStatusChange((option?.value as NarrativeStatus | undefined) ?? "vivo")
            }
          />
        </div>

        {narrativeStatus === "secreto" ? (
          <div className={`${styles.modalField} ${styles.modalFieldWide}`}>
            <span>Campos secretos para outros membros</span>
            <ReactMultiSelectField
              options={secretFieldOptions}
              value={secretFieldOptions.filter((option) => secretFieldKeys.includes(option.value as SecretFieldKey))}
              onChange={(options) =>
                onSecretFieldKeysChange(options.map((option) => option.value as SecretFieldKey))
              }
              placeholder="Selecione os campos que serao mascarados"
            />
          </div>
        ) : null}

        <label className={styles.modalField}>
          <span>Raca</span>
          <input
            value={raceLabel}
            onChange={(event) => onRaceChange(event.target.value)}
            placeholder="Digite a raca que quiser"
          />
        </label>

        <label className={styles.modalField}>
          <span>Classe</span>
          <input
            value={classLabel}
            onChange={(event) => onClassChange(event.target.value)}
            placeholder="Digite a classe que quiser"
          />
        </label>

        {(bootstrap?.statuses ?? []).length > 0 ? (
          <div className={`${styles.modalSection} ${styles.modalFieldWide}`}>
            <div className={styles.modalSectionHeader}>
              <h3>Status</h3>
            </div>
            <NumericTemplateGrid
              items={(bootstrap?.statuses ?? []).map((status) => ({
                key: status.key,
                label: status.label,
              }))}
              values={statusValues}
              onChange={onStatusChange}
              gridClassName={styles.modalGrid}
              fieldClassName={styles.modalField}
              keyPrefix="npc-monster-status"
              min={0}
            />
          </div>
        ) : null}

        {extraFields
          .filter((field) => field.key.trim().length > 0)
          .map((field) => (
            <label key={field.id} className={styles.modalField}>
              <span>{field.key}</span>
              <div className={styles.modalUploadRow}>
                <input
                  value={field.value}
                  onChange={(event) => onExtraFieldValueChange(field.id, event.target.value)}
                />
                <button
                  type="button"
                  className={styles.modalIconButton}
                  onClick={() => onRemoveExtraField(field.id)}
                  aria-label={`Remover campo ${field.key}`}
                  title={`Remover campo ${field.key}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </label>
          ))}
      </div>
    </div>
  )
}
