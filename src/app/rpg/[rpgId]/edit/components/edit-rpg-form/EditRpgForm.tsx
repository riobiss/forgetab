"use client"

import { FormEvent } from "react"
import Link from "next/link"
import { LoaderCircle, Save, Trash2, X } from "lucide-react"
import styles from "../../page.module.css"
import type { Visibility } from "../../hooks/useEditRpgState"

type Props = {
  title: string
  onTitleChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  visibility: Visibility
  onVisibilityChange: (value: Visibility) => void
  useMundiMap: boolean
  onUseMundiMapChange: (value: boolean) => void
  useInventoryWeightLimit: boolean
  onUseInventoryWeightLimitChange: (value: boolean) => void
  costsEnabled: boolean
  costResourceName: string
  error: string
  success: string
  saving: boolean
  deleting: boolean
  onSaveAll: () => Promise<void>
  onDeleteRpg: () => Promise<void>
}

export default function EditRpgForm({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  visibility,
  onVisibilityChange,
  useMundiMap,
  onUseMundiMapChange,
  useInventoryWeightLimit,
  onUseInventoryWeightLimitChange,
  costsEnabled,
  costResourceName,
  error,
  success,
  saving,
  deleting,
  onSaveAll,
  onDeleteRpg,
}: Props) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSaveAll()
  }

  return (
    <>
      <form id="edit-rpg-form" className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <label className={styles.field}>
          <span>Titulo</span>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            minLength={3}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Descricao</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            minLength={10}
            rows={5}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Visibilidade</span>
          <select
            value={visibility}
            onChange={(event) => onVisibilityChange(event.target.value as Visibility)}
          >
            <option value="private">Privado</option>
            <option value="public">Publico</option>
          </select>
        </label>

        <label className={`${styles.field} ${styles.checkboxField}`}>
          <span>Mapa mundi</span>
          <input
            type="checkbox"
            checked={useMundiMap}
            onChange={(event) => onUseMundiMapChange(event.target.checked)}
          />
        </label>

        <label className={`${styles.field} ${styles.checkboxField}`}>
          <span>Controle de peso no inventario</span>
          <input
            type="checkbox"
            checked={useInventoryWeightLimit}
            onChange={(event) => onUseInventoryWeightLimitChange(event.target.checked)}
          />
        </label>

        <div className={styles.field}>
          <span>Custos (somente leitura)</span>
          <input value={costsEnabled ? "Ativado" : "Desativado"} readOnly />
          <input value={costResourceName} readOnly />
          <p className={styles.error}>Configuracao disponivel apenas na criacao do RPG.</p>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}
      </form>

      <div className={`${styles.actions} ${styles.footerActions}`}>
        <button type="submit" form="edit-rpg-form" disabled={saving}>
          {saving ? (
            <>
              <LoaderCircle size={16} className={styles.spin} />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Salvar tudo</span>
            </>
          )}
        </button>
        <button type="button" onClick={() => void onDeleteRpg()} disabled={deleting || saving}>
          {deleting ? (
            <>
              <LoaderCircle size={16} className={styles.spin} />
              <span>Deletando...</span>
            </>
          ) : (
            <>
              <Trash2 size={16} />
              <span>Deletar RPG</span>
            </>
          )}
        </button>
        <Link href="/rpg">
          <X size={16} />
          <span>Cancelar</span>
        </Link>
      </div>
    </>
  )
}
