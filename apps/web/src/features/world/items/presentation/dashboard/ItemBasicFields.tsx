import Image from "next/image"
import { useEffect, useState } from "react"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import type {
  ItemRarityDto,
  ItemTypeDto
} from "@/features/world/items/application/dashboard/types"
import {
  itemRarityLabel,
  itemTypeLabel
} from "@/shared/presentation/items/itemLabels"
import type { ItemUpsertModalProps } from "./itemEditorTypes"
import styles from "./ItemsDashboardClient.module.css"

type Props = Pick<
  ItemUpsertModalProps,
  | "name"
  | "setName"
  | "description"
  | "setDescription"
  | "type"
  | "setType"
  | "rarity"
  | "setRarity"
  | "damage"
  | "setDamage"
  | "range"
  | "setRange"
  | "weight"
  | "setWeight"
  | "duration"
  | "setDuration"
  | "durability"
  | "setDurability"
  | "customFields"
  | "setCustomFields"
  | "image"
  | "selectedImageFile"
  | "selectedImagePreviewUrl"
  | "uploadingImage"
  | "baseItemTypeValues"
  | "baseItemRarityValues"
  | "onImageUpload"
  | "onRemoveImage"
  | "saving"
>

export function ItemBasicFields(props: Props) {
  const [showImagePreview, setShowImagePreview] = useState(true)

  useEffect(() => {
    setShowImagePreview(true)
  }, [props.image, props.selectedImagePreviewUrl])

  return (
    <div className={styles.formGrid}>
      <label className={`${styles.field} ${styles.spanTwo}`}>
        <span>Imagem do item</span>
        <div className={styles.imageActions}>
          <label htmlFor="item-image-file" className={styles.ghostButton}>
            {props.uploadingImage
              ? "Enviando..."
              : props.selectedImageFile
                ? "Trocar imagem"
                : "Adicionar imagem"}
          </label>
          {props.image || props.selectedImageFile ? (
            <>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => setShowImagePreview((current) => !current)}
              >
                {showImagePreview ? "Ocultar preview" : "Mostrar preview"}
              </button>
              <button
                type="button"
                className={styles.removeButton}
                onClick={props.onRemoveImage}
                disabled={props.saving || props.uploadingImage}
              >
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
            if (file) props.onImageUpload(file)
          }}
          disabled={props.saving || props.uploadingImage}
        />
      </label>

      {(props.selectedImagePreviewUrl || props.image) && showImagePreview ? (
        <div className={`${styles.field} ${styles.spanTwo}`}>
          <span>Preview</span>
          <div className={styles.itemImagePreviewFrame}>
            <Image
              src={props.selectedImagePreviewUrl || props.image}
              alt={`Imagem de ${props.name || "item"}`}
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
        <input
          value={props.name}
          onChange={(event) => props.setName(event.target.value)}
          minLength={2}
          required
        />
      </label>
      <label className={`${styles.field} ${styles.spanTwo}`}>
        <span>Descricao</span>
        <textarea
          rows={4}
          value={props.description}
          onChange={(event) => props.setDescription(event.target.value)}
          placeholder="Descricao opcional do item"
        />
      </label>
      <label className={`${styles.field} ${styles.spanTwo}`}>
        <span>Tipo</span>
        <NativeSelectField
          value={props.type}
          onValueChange={(value) => props.setType(value as ItemTypeDto)}
        >
          {props.baseItemTypeValues.map((option) => (
            <option key={option} value={option}>
              {itemTypeLabel[option]}
            </option>
          ))}
        </NativeSelectField>
      </label>
      <label className={styles.field}>
        <span>Raridade</span>
        <NativeSelectField
          value={props.rarity}
          onValueChange={(value) => props.setRarity(value as ItemRarityDto)}
        >
          {props.baseItemRarityValues.map((option) => (
            <option key={option} value={option}>
              {itemRarityLabel[option]}
            </option>
          ))}
        </NativeSelectField>
      </label>
      {[
        ["Dano", props.damage, props.setDamage, "Ex: 1d6 + 2"],
        ["Alcance", props.range, props.setRange, "Ex: 9m"],
        ["Duracao", props.duration, props.setDuration, ""]
      ].map(([label, value, setter, placeholder]) => (
        <label key={label as string} className={styles.field}>
          <span>{label as string}</span>
          <input
            value={value as string}
            onChange={(event) =>
              (setter as (value: string) => void)(event.target.value)
            }
            placeholder={placeholder as string}
          />
        </label>
      ))}
      {[
        ["Peso", props.weight, props.setWeight, "0.1"],
        ["Durabilidade", props.durability, props.setDurability, "1"]
      ].map(([label, value, setter, step]) => (
        <label key={label as string} className={styles.field}>
          <span>{label as string}</span>
          <input
            type="number"
            min={0}
            step={step as string}
            value={value as string}
            onChange={(event) =>
              (setter as (value: string) => void)(event.target.value)
            }
          />
        </label>
      ))}

      {props.customFields.length > 0 ? (
        <div className={`${styles.editorSection} ${styles.spanTwo}`}>
          <h4>Campos extras</h4>
          <div className={styles.formGrid}>
            {props.customFields.map((field) => (
              <label key={field.id} className={styles.field}>
                <span>{field.name}</span>
                <div className={styles.customFieldRow}>
                  <input
                    value={field.value}
                    onChange={(event) =>
                      props.setCustomFields((current) =>
                        current.map((item) =>
                          item.id === field.id
                            ? { ...item, value: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() =>
                      props.setCustomFields((current) =>
                        current.filter((item) => item.id !== field.id)
                      )
                    }
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
  )
}
