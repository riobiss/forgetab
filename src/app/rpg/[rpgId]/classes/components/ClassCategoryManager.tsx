"use client"

import { FormEvent, useMemo, useState } from "react"
import styles from "../page.module.css"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import ClassCategoryToggleList from "./ClassCategoryToggleList"

type ClassItem = {
  id: string
  key: string
  label: string
  category: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
}

type Props = {
  rpgId: string
  initialClasses: ClassItem[]
}

function normalizeCategory(category: string) {
  return category.trim() || "geral"
}

export default function ClassCategoryManager({ rpgId, initialClasses }: Props) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses)
  const [draftCategories, setDraftCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newClassName, setNewClassName] = useState("")
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false)
  const [isMoveCategoryModalOpen, setIsMoveCategoryModalOpen] = useState(false)
  const [movingClassId, setMovingClassId] = useState("")
  const [movingCategory, setMovingCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const categories = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((item) => set.add(normalizeCategory(item.category)))
    draftCategories.forEach((item) => set.add(normalizeCategory(item)))
    return Array.from(set).sort((left, right) => left.localeCompare(right, "pt-BR"))
  }, [classes, draftCategories])

  const classGroups = useMemo(
    () =>
      categories.map((category) => ({
        category,
        items: classes
          .filter((item) => normalizeCategory(item.category) === category)
          .map((item) => ({
            id: item.id,
            title: item.label,
            subtitle: item.key,
            href: `/rpg/${rpgId}/classes/${item.id}`,
            editHref: `/rpg/${rpgId}/edit/advanced/class/${item.key}`,
          })),
      })),
    [categories, classes, rpgId],
  )

  const classOptions = useMemo(
    () => [...classes].sort((left, right) => left.label.localeCompare(right.label, "pt-BR")),
    [classes],
  )

  async function saveClasses(nextClasses: ClassItem[]) {
    if (saving) return false
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const payload = {
        classes: nextClasses.map((item) => ({
          label: item.label,
          category: normalizeCategory(item.category),
          attributeBonuses: item.attributeBonuses,
          skillBonuses: item.skillBonuses,
        })),
      }

      const response = await fetch(`/api/rpg/${rpgId}/classes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        setError(result.message ?? "Nao foi possivel salvar classes.")
        return false
      }

      setClasses(nextClasses)
      setMessage("Classes atualizadas com sucesso.")
      return true
    } catch {
      setError("Erro de conexao ao salvar classes.")
      return false
    } finally {
      setSaving(false)
    }
  }

  function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const normalized = normalizeCategory(newCategory)
    if (!normalized) return

    if (categories.includes(normalized)) {
      setError("Categoria ja existe.")
      return
    }

    setDraftCategories((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]))
    setNewCategory("")
    setSelectedCategory(normalized)
    setMessage(`Categoria "${normalized}" criada. Agora crie uma classe nela para salvar no RPG.`)
    setError("")
    setIsCreateCategoryModalOpen(false)
  }

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const label = newClassName.trim()
    if (label.length < 2) {
      setError("Nome da classe precisa ter pelo menos 2 caracteres.")
      return
    }

    const category = normalizeCategory(selectedCategory || newCategory || "geral")
    const hasDuplicate = classes.some(
      (item) => item.label.toLocaleLowerCase("pt-BR") === label.toLocaleLowerCase("pt-BR"),
    )
    if (hasDuplicate) {
      setError("Ja existe uma classe com esse nome.")
      return
    }

    const nextClasses: ClassItem[] = [
      ...classes,
      {
        id: crypto.randomUUID(),
        key: `temp-${crypto.randomUUID().slice(0, 8)}`,
        label,
        category,
        attributeBonuses: {},
        skillBonuses: {},
      },
    ]

    const saved = await saveClasses(nextClasses)
    if (!saved) return

    setNewClassName("")
    setSelectedCategory(category)
    setDraftCategories((prev) => prev.filter((item) => normalizeCategory(item) !== category))
    setIsCreateClassModalOpen(false)
  }

  function handleOpenMoveCategoryModal() {
    const classItem = classOptions[0]
    if (!classItem) return
    setMovingClassId(classItem.id)
    setMovingCategory(normalizeCategory(classItem.category))
    setIsMoveCategoryModalOpen(true)
  }

  function handleMovingClassChange(classId: string) {
    setMovingClassId(classId)
    const classItem = classes.find((item) => item.id === classId)
    if (!classItem) return
    setMovingCategory(normalizeCategory(classItem.category))
  }

  async function handleMoveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !movingClassId) return

    const nextCategory = normalizeCategory(movingCategory)
    const classItem = classes.find((item) => item.id === movingClassId)
    if (!classItem) {
      setError("Classe nao encontrada.")
      return
    }

    if (normalizeCategory(classItem.category) === nextCategory) {
      setMessage("A classe ja esta nesta categoria.")
      setIsMoveCategoryModalOpen(false)
      return
    }

    const nextClasses = classes.map((item) =>
      item.id === movingClassId
        ? {
            ...item,
            category: nextCategory,
          }
        : item,
    )

    const saved = await saveClasses(nextClasses)
    if (!saved) return

    setDraftCategories((prev) => prev.filter((item) => normalizeCategory(item) !== nextCategory))
    setIsMoveCategoryModalOpen(false)
    setMovingClassId("")
  }

  return (
    <>
      <section className={styles.managerCard}>
        <h3>Gerenciar categorias e classes</h3>

        <div className={styles.managerActions}>
          <button type="button" onClick={() => setIsCreateCategoryModalOpen(true)} disabled={saving}>
            Criar categoria
          </button>
          <button type="button" onClick={() => setIsCreateClassModalOpen(true)} disabled={saving}>
            Criar classe
          </button>
          <button type="button" onClick={handleOpenMoveCategoryModal} disabled={saving || classes.length === 0}>
            Trocar categoria
          </button>
        </div>

        {error ? <p className={styles.managerError}>{error}</p> : null}
        {message ? <p className={styles.managerMessage}>{message}</p> : null}
      </section>

      <ClassCategoryToggleList groups={classGroups} showEditActions />
      {classGroups.length === 0 ? <p>Nenhuma classe cadastrada.</p> : null}

      {isCreateCategoryModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setIsCreateCategoryModalOpen(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Criar categoria"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Criar categoria</h2>
            <form className={styles.inlineForm} onSubmit={handleCreateCategory}>
              <input
                type="text"
                placeholder="Nova categoria (ex: Magicos)"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                disabled={saving}
                autoFocus
              />
              <button type="submit" disabled={saving}>
                Confirmar
              </button>
            </form>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setIsCreateCategoryModalOpen(false)} disabled={saving}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isCreateClassModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setIsCreateClassModalOpen(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Criar classe"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Criar classe</h2>
            <form className={styles.classModalForm} onSubmit={handleCreateClass}>
              <NativeSelectField
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                disabled={saving}
              >
                <option value="">Selecione categoria</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </NativeSelectField>
              <input
                type="text"
                placeholder="Nome da classe"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                disabled={saving}
              />
              <div className={styles.modalActions}>
                <button type="submit" disabled={saving}>
                  Confirmar
                </button>
                <button type="button" onClick={() => setIsCreateClassModalOpen(false)} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isMoveCategoryModalOpen ? (
        <div className={styles.modalOverlay} onClick={() => setIsMoveCategoryModalOpen(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Trocar categoria de classe"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Trocar categoria</h2>
            <form className={styles.classModalForm} onSubmit={handleMoveCategory}>
              <NativeSelectField
                value={movingClassId}
                onChange={(event) => handleMovingClassChange(event.target.value)}
                disabled={saving}
              >
                <option value="">Selecione classe</option>
                {classOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </NativeSelectField>
              <NativeSelectField
                value={movingCategory}
                onChange={(event) => setMovingCategory(event.target.value)}
                disabled={saving}
              >
                <option value="">Selecione categoria</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </NativeSelectField>
              <div className={styles.modalActions}>
                <button type="submit" disabled={saving || !movingClassId || !movingCategory}>
                  Salvar
                </button>
                <button type="button" onClick={() => setIsMoveCategoryModalOpen(false)} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
