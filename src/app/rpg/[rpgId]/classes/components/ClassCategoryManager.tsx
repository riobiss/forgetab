"use client"

import { FormEvent, useMemo, useState } from "react"
import styles from "../page.module.css"

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
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const categories = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((item) => set.add(normalizeCategory(item.category)))
    draftCategories.forEach((item) => set.add(normalizeCategory(item)))
    return Array.from(set).sort((left, right) => left.localeCompare(right, "pt-BR"))
  }, [classes, draftCategories])

  async function saveClasses(nextClasses: ClassItem[]) {
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
  }

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
  }

  return (
    <section className={styles.managerCard}>
      <h3>Gerenciar categorias e classes</h3>

      <div className={styles.managerActions}>
        <form className={styles.inlineForm} onSubmit={handleCreateCategory}>
          <input
            type="text"
            placeholder="Nova categoria (ex: Magicos)"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            disabled={saving}
          />
          <button type="submit" disabled={saving}>
            Criar categoria
          </button>
        </form>

        <form className={styles.inlineForm} onSubmit={handleCreateClass}>
          <select
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
          </select>
          <input
            type="text"
            placeholder="Nome da classe"
            value={newClassName}
            onChange={(event) => setNewClassName(event.target.value)}
            disabled={saving}
          />
          <button type="submit" disabled={saving}>
            Criar classe na categoria
          </button>
        </form>
      </div>

      {error ? <p className={styles.managerError}>{error}</p> : null}
      {message ? <p className={styles.managerMessage}>{message}</p> : null}
    </section>
  )
}
