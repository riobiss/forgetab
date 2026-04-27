"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { ReactSelectField, type ReactSelectOption } from "@/components/select/ReactSelectField"
import type { CharacterEditorBootstrapDto, CharacterEditorSummaryDto } from "@/application/characters/editor"
import {
  createCreatureUseCase,
  createCreatureTemplateCategory,
  createCreatureTemplateField,
  type CreateCreaturePayloadDto,
  deleteCreatureUseCase,
  type CreaturesDependencies,
  type CreatureAttributeRow,
  type CreatureTemplateCategoryDto,
  buildCreatureIdentityPayload,
  buildCreatureRowsFromCharacter,
  buildCreatureRowsFromTemplates,
  buildEmptyNumericRecord,
  findCreatureTemplateRow,
  getCreatureTemplateRowId,
  updateCreatureTemplatesUseCase,
  updateCreatureUseCase,
  uploadCreatureImageUseCase,
} from "@/application/creatures"
import { createCreaturesDependencies } from "@/infrastructure/creatures/dependencies"
import styles from "./CreaturePages.module.css"

type Props = {
  rpgId: string
  bootstrap: CharacterEditorBootstrapDto
  categories: CreatureTemplateCategoryDto[]
  creature?: CharacterEditorSummaryDto | null
  deps?: CreaturesDependencies
}

const defaultDeps = createCreaturesDependencies("http")

export default function CreatureEditorPage({
  rpgId,
  bootstrap,
  categories,
  creature = null,
  deps = defaultDeps,
}: Props) {
  const router = useRouter()
  const [templateCategories, setTemplateCategories] = useState(categories)
  const [newCategoryLabel, setNewCategoryLabel] = useState("")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("")
  const [templatesDirty, setTemplatesDirty] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [name, setName] = useState(creature?.name ?? "")
  const [image, setImage] = useState(creature?.image ?? "")
  const [visibility, setVisibility] = useState<"public" | "private">(creature?.visibility ?? "public")
  const [rows, setRows] = useState<CreatureAttributeRow[]>(() => {
    const initialRows = buildCreatureRowsFromCharacter(creature)
    return buildCreatureRowsFromTemplates(categories, initialRows)
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const categoryOptions = useMemo<ReactSelectOption[]>(
    () => templateCategories.map((category) => ({ value: category.key, label: category.label })),
    [templateCategories],
  )

  function updateTemplateFieldValue(
    category: CreatureTemplateCategoryDto,
    field: CreatureTemplateCategoryDto["fields"][number],
    value: string,
  ) {
    setRows((current) => {
      const currentRow = findCreatureTemplateRow(current, category.key, field.key)
      if (currentRow) {
        return current.map((row) => (row.id === currentRow.id ? { ...row, value } : row))
      }

      return [
        ...current,
        {
          id: getCreatureTemplateRowId(category.key, field.key),
          categoryKey: category.key,
          fieldKey: field.key,
          value,
        },
      ]
    })
  }

  function addCategory() {
    const label = newCategoryLabel.trim()
    if (label.length < 2) {
      toast.error("Informe um nome valido para a categoria.")
      return
    }

    const { categoryKey, categories: nextCategories } = createCreatureTemplateCategory(templateCategories, label)
    setTemplateCategories(nextCategories)
    setSelectedCategoryKey(categoryKey)
    setNewCategoryLabel("")
    setTemplatesDirty(true)
  }

  function addField() {
    const label = newFieldLabel.trim()
    if (!selectedCategoryKey) {
      toast.error("Selecione uma categoria.")
      return
    }
    if (label.length < 1) {
      toast.error("Informe o atributo.")
      return
    }

    const { fieldKey, categories: nextCategories } = createCreatureTemplateField(
      templateCategories,
      selectedCategoryKey,
      label,
    )
    setTemplateCategories(nextCategories)
    setRows((current) => [
      ...current,
      {
        id: getCreatureTemplateRowId(selectedCategoryKey, fieldKey),
        categoryKey: selectedCategoryKey,
        fieldKey,
        value: "",
      },
    ])
    setNewFieldLabel("")
    setTemplatesDirty(true)
  }

  async function handleUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setUploading(true)
      const payload = await uploadCreatureImageUseCase(deps, { file })
      setImage(payload.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar imagem.")
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      if (templatesDirty) {
        await updateCreatureTemplatesUseCase(deps, { rpgId, categories: templateCategories })
      }

      const payload: CreateCreaturePayloadDto = {
        name: name.trim(),
        image: image.trim() || null,
        visibility,
        characterType: "creature",
        progressionCurrent: 0,
        statuses: buildEmptyNumericRecord(bootstrap.statuses),
        attributes: buildEmptyNumericRecord(bootstrap.attributes),
        skills: buildEmptyNumericRecord(bootstrap.skills),
        characteristics: {},
        identity: buildCreatureIdentityPayload(rows),
      }

      const savedCreature = creature
        ? await updateCreatureUseCase(deps, { rpgId, creatureId: creature.id, payload })
        : await createCreatureUseCase(deps, { rpgId, payload })

      toast.success(creature ? "Criatura atualizada." : "Criatura criada.")
      setTemplatesDirty(false)
      router.push(`/rpg/${rpgId}/creatures/${savedCreature.id}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar criatura.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!creature) {
      return
    }

    try {
      setDeleting(true)
      await deleteCreatureUseCase(deps, { rpgId, creatureId: creature.id })
      toast.success("Criatura removida.")
      router.push(`/rpg/${rpgId}/creatures`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover criatura.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.titleBlock}>
          <p>{creature ? "Edicao" : "Criacao"}</p>
          <h1>{creature ? creature.name : "Nova criatura"}</h1>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {creature ? (
            <button type="button" className={styles.dangerButton} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removendo..." : "Excluir"}
            </button>
          ) : null}
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.stack}>
          <div className={styles.rowTwo}>
            <label className={styles.label}>
              <span>Nome</span>
              <input className={styles.field} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className={styles.label}>
              <span>Visibilidade</span>
              <select className={styles.field} value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")}>
                <option value="public">Publica</option>
                <option value="private">Privada</option>
              </select>
            </label>
          </div>

          <div className={styles.rowTwo}>
            <label className={styles.label}>
              <span>Imagem</span>
              <input className={styles.field} value={image} onChange={(event) => setImage(event.target.value)} placeholder="URL da imagem" />
            </label>
            <label className={styles.label}>
              <span>Upload</span>
              <input className={styles.field} type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading} />
            </label>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.topbar}>
          <div className={styles.titleBlock}>
            <h2>Categorias</h2>
            <p>Preencha os atributos configurados para esta criatura.</p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setTemplateModalOpen(true)}>
              Adicionar categoria/atributo
            </button>
          </div>
        </div>

        <div className={styles.stack}>
          {templateCategories.map((category) => (
            <article key={category.id} className={styles.categoryCard}>
              <h3 className={styles.cardTitle}>{category.label}</h3>
              {category.fields.length > 0 ? (
                <div className={styles.attributeGrid}>
                  {category.fields.map((field) => {
                    const row = findCreatureTemplateRow(rows, category.key, field.key)
                    return (
                      <label key={field.id} className={styles.label}>
                        <span>{field.label}</span>
                        <input
                          className={styles.field}
                          type={field.fieldType === "number" ? "number" : "text"}
                          value={row?.value ?? ""}
                          onChange={(event) => updateTemplateFieldValue(category, field, event.target.value)}
                          placeholder="Valor"
                        />
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className={styles.helper}>Nenhum atributo nesta categoria.</p>
              )}
            </article>
          ))}
          {templateCategories.length === 0 ? (
            <p className={styles.helper}>Nenhuma categoria cadastrada. Use o botao acima para adicionar.</p>
          ) : null}
        </div>
      </section>

      {templateModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setTemplateModalOpen(false)}>
          <section
            className={styles.modalShell}
            role="dialog"
            aria-modal="true"
            aria-labelledby="creature-template-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalKicker}>Modelo</p>
                <h2 id="creature-template-modal-title" className={styles.modalTitle}>
                  Categorias e atributos
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setTemplateModalOpen(false)}
                aria-label="Fechar modal"
              >
                x
              </button>
            </div>

            <div className={styles.modalBody}>
              <section className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <h3>Adicionar categoria</h3>
                </div>
                <div className={styles.modalGrid}>
                  <label className={styles.modalField}>
                    <span>Categoria</span>
                    <input
                      value={newCategoryLabel}
                      onChange={(event) => setNewCategoryLabel(event.target.value)}
                      placeholder="Nome da categoria"
                    />
                  </label>
                  <div className={styles.modalFieldAction}>
                    <button type="button" className={styles.modalPrimaryButton} onClick={addCategory}>
                      + Categoria
                    </button>
                  </div>
                </div>
              </section>

              <section className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <h3>Adicionar atributo</h3>
                </div>
                <div className={styles.modalGrid}>
                  <ReactSelectField
                    label="Categoria existente"
                    options={categoryOptions}
                    value={categoryOptions.find((option) => option.value === selectedCategoryKey) ?? null}
                    onChange={(option) => setSelectedCategoryKey(option?.value ?? "")}
                    placeholder="Selecione"
                  />
                  <label className={styles.modalField}>
                    <span>Atributo</span>
                    <input
                      value={newFieldLabel}
                      onChange={(event) => setNewFieldLabel(event.target.value)}
                      placeholder="Nome do atributo"
                    />
                  </label>
                  <div className={styles.modalFieldAction}>
                    <button type="button" className={styles.modalPrimaryButton} onClick={addField}>
                      + Atributo
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
