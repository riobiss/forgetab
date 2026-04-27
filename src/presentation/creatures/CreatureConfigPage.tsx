"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Plus } from "lucide-react"
import { ReactSelectField, type ReactSelectOption } from "@/components/select/ReactSelectField"
import type { CreaturesDependencies, CreatureTemplateCategoryDto } from "@/application/creatures"
import {
  createCreatureTemplateCategory,
  createCreatureTemplateField,
  updateCreatureTemplateField,
  updateCreatureTemplatesUseCase,
} from "@/application/creatures"
import { createCreaturesDependencies } from "@/infrastructure/creatures/dependencies"
import styles from "./CreaturePages.module.css"

type Props = {
  rpgId: string
  initialCategories: CreatureTemplateCategoryDto[]
  deps?: CreaturesDependencies
}

const fieldTypeOptions: ReactSelectOption[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Numero" },
]

const defaultDeps = createCreaturesDependencies("http")

export default function CreatureConfigPage({ rpgId, initialCategories, deps = defaultDeps }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [newCategoryLabel, setNewCategoryLabel] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [fieldModalCategoryKey, setFieldModalCategoryKey] = useState("")
  const [editingField, setEditingField] = useState<{ categoryKey: string; fieldId: string } | null>(null)
  const [editingFieldLabel, setEditingFieldLabel] = useState("")
  const [editingFieldType, setEditingFieldType] = useState<"text" | "number">("text")
  const [saving, setSaving] = useState(false)

  function addCategory() {
    const label = newCategoryLabel.trim()
    if (label.length < 2) {
      toast.error("Informe um nome valido para a categoria.")
      return
    }

    setCategories((current) => createCreatureTemplateCategory(current, label).categories)
    setNewCategoryLabel("")
  }

  function addField(categoryKey: string) {
    const label = newFieldLabel.trim()
    if (label.length < 1) {
      toast.error("Informe a chave.")
      return
    }

    setCategories((current) => createCreatureTemplateField(current, categoryKey, label).categories)
    setNewFieldLabel("")
    setFieldModalCategoryKey("")
  }

  function openFieldModal(categoryKey: string) {
    setFieldModalCategoryKey(categoryKey)
    setNewFieldLabel("")
  }

  function openEditFieldModal(categoryKey: string, fieldId: string) {
    const category = categories.find((item) => item.key === categoryKey)
    const field = category?.fields.find((item) => item.id === fieldId)
    if (!field) return

    setEditingField({ categoryKey, fieldId })
    setEditingFieldLabel(field.label)
    setEditingFieldType(field.fieldType ?? "text")
  }

  function closeEditFieldModal() {
    setEditingField(null)
    setEditingFieldLabel("")
    setEditingFieldType("text")
  }

  function updateEditingField() {
    if (!editingField) return

    const label = editingFieldLabel.trim()
    if (label.length < 1) {
      toast.error("Informe o nome da chave.")
      return
    }

    setCategories((current) =>
      updateCreatureTemplateField(current, {
        categoryKey: editingField.categoryKey,
        fieldId: editingField.fieldId,
        label,
        fieldType: editingFieldType,
      }),
    )
    closeEditFieldModal()
  }

  async function handleSave() {
    try {
      setSaving(true)
      await updateCreatureTemplatesUseCase(deps, { rpgId, categories })
      toast.success("Configuracao de criaturas atualizada.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configuracao.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.titleBlock}>
          <p>Criaturas</p>
          <h1>Configuracao</h1>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.rowTwo}>
          <label className={styles.label}>
            <span>Categoria</span>
            <input
              className={styles.field}
              value={newCategoryLabel}
              onChange={(event) => setNewCategoryLabel(event.target.value)}
              placeholder="Nome da categoria"
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={addCategory}>
              + Categoria
            </button>
          </div>
        </div>
      </section>

      <section className={styles.categoryList}>
        {categories.map((category) => (
          <article key={category.id} className={styles.categoryCard}>
            <div className={styles.categoryCardHeader}>
              <h2 className={styles.cardTitle}>{category.label}</h2>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => openFieldModal(category.key)}
                aria-label={`Adicionar chave em ${category.label}`}
                title={`Adicionar chave em ${category.label}`}
              >
                <Plus size={18} />
              </button>
            </div>
            <div className={styles.chipRow}>
              {category.fields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  className={`${styles.chip} ${styles.chipButton}`}
                  onClick={() => openEditFieldModal(category.key, field.id)}
                >
                  {field.label}
                </button>
              ))}
              {category.fields.length === 0 ? <span className={styles.helper}>Sem chaves.</span> : null}
            </div>
          </article>
        ))}
        {categories.length === 0 ? (
          <section className={styles.panel}>
            <p className={styles.helper}>Nenhuma categoria cadastrada.</p>
          </section>
        ) : null}
      </section>

      {fieldModalCategoryKey ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setFieldModalCategoryKey("")}>
          <section
            className={styles.simpleModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="creature-field-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="creature-field-modal-title" className={styles.simpleModalTitle}>
              Adicionar chave
            </h3>
            <div className={styles.simpleModalGrid}>
              <label className={styles.modalField}>
                <span>Chave</span>
                <input
                  value={newFieldLabel}
                  onChange={(event) => setNewFieldLabel(event.target.value)}
                  placeholder="Nome da chave"
                  autoFocus
                />
              </label>
              <div className={styles.modalFieldAction}>
                <button
                  type="button"
                  className={styles.modalPrimaryButton}
                  onClick={() => addField(fieldModalCategoryKey)}
                >
                  + Chave
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {editingField ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeEditFieldModal}>
          <section
            className={styles.simpleModal}
            role="dialog"
            aria-modal="true"
            aria-label="Editar chave"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.simpleModalGrid}>
              <label className={styles.modalField}>
                <span>Nome</span>
                <input
                  value={editingFieldLabel}
                  onChange={(event) => setEditingFieldLabel(event.target.value)}
                  placeholder="Nome exibido"
                  autoFocus
                />
              </label>
              <ReactSelectField
                label="Tipo"
                options={fieldTypeOptions}
                value={fieldTypeOptions.find((option) => option.value === editingFieldType) ?? null}
                onChange={(option) => setEditingFieldType(option?.value === "number" ? "number" : "text")}
                placeholder="Tipo"
              />
              <div className={styles.modalFieldAction}>
                <button type="button" className={styles.modalPrimaryButton} onClick={updateEditingField}>
                  Salvar
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
