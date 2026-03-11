"use client"

import AdvancedIdentityEditor from "@/presentation/rpg-editor/edit/components/AdvancedIdentityEditor"
import { useAdvancedIdentityEditor } from "@/presentation/rpg-editor/edit/advanced/useAdvancedIdentityEditor"
import type { AdvancedIdentityType } from "@/presentation/rpg-editor/edit/advanced/types"
import styles from "./page.module.css"

type Props = {
  rpgId: string
  identityType: string
  templateKey: string
}

export default function AdvancedIdentityFeature({ rpgId, identityType, templateKey }: Props) {
  const type: AdvancedIdentityType | null =
    identityType === "race" || identityType === "class" ? identityType : null

  const {
    mode,
    loading,
    saving,
    error,
    success,
    draft,
    setDraft,
    attributeTemplates,
    skillTemplates,
    handleSave,
    handleCancel,
  } = useAdvancedIdentityEditor({
    rpgId,
    type,
    templateKey,
  })

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>Carregando editor avancado...</p>
      </main>
    )
  }

  if (!type || !draft) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>{error || "Nao foi possivel abrir o editor."}</p>
        <button type="button" className={styles.backButton} onClick={handleCancel}>
          Voltar para editar RPG
        </button>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <AdvancedIdentityEditor
        type={type}
        mode={mode}
        draft={draft}
        attributeTemplates={attributeTemplates}
        skillTemplates={skillTemplates}
        saving={saving}
        error={error}
        success={success}
        onChange={setDraft}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </main>
  )
}
