"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import styles from "./page.module.css"
import {
  baseItemRarityValues,
  baseItemTypeValues,
} from "@/lib/validators/baseItem"

type ItemType = (typeof baseItemTypeValues)[number]
type ItemRarity = (typeof baseItemRarityValues)[number]

type BaseItem = {
  id: string
  rpgId: string
  name: string
  type: ItemType
  rarity: ItemRarity
  createdAt: string
  updatedAt: string
}

type ApiListPayload = {
  items?: BaseItem[]
  message?: string
}

type ApiItemPayload = {
  item?: BaseItem
  message?: string
}

export default function ItemsPage() {
  const params = useParams<{ rpgId: string }>()
  const rpgId = params.rpgId

  const [items, setItems] = useState<BaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<ItemType>("weapon")
  const [rarity, setRarity] = useState<ItemRarity>("common")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)

  const isEditing = useMemo(() => Boolean(editingItemId), [editingItemId])

  async function loadItems() {
    try {
      setLoading(true)
      setLoadingError("")

      const response = await fetch(`/api/rpg/${rpgId}/items`)
      const payload = (await response.json()) as ApiListPayload

      if (!response.ok) {
        setLoadingError(payload.message ?? "Nao foi possivel carregar os itens.")
        setItems([])
        return
      }

      setItems(payload.items ?? [])
    } catch {
      setLoadingError("Erro de conexao ao carregar itens.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (rpgId) {
      void loadItems()
    }
  }, [rpgId])

  function resetForm() {
    setEditingItemId(null)
    setName("")
    setType("weapon")
    setRarity("common")
    setSubmitError("")
  }

  function openCreateForm() {
    resetForm()
    setIsFormOpen(true)
  }

  function openEditForm(item: BaseItem) {
    setEditingItemId(item.id)
    setName(item.name)
    setType(item.type)
    setRarity(item.rarity)
    setSubmitError("")
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    resetForm()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setSubmitError("")

    try {
      const endpoint = isEditing
        ? `/api/rpg/${rpgId}/items/${editingItemId}`
        : `/api/rpg/${rpgId}/items`

      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          rarity,
        }),
      })

      const payload = (await response.json()) as ApiItemPayload

      if (!response.ok) {
        setSubmitError(payload.message ?? "Nao foi possivel salvar o item.")
        return
      }

      if (!payload.item) {
        setSubmitError("Resposta invalida da API.")
        return
      }

      if (isEditing) {
        setItems((prev) =>
          prev.map((item) => (item.id === payload.item?.id ? payload.item : item)),
        )
      } else {
        setItems((prev) => [payload.item as BaseItem, ...prev])
      }

      closeForm()
    } catch {
      setSubmitError("Erro de conexao ao salvar item.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Sessao avancada</p>
          <h1 className={styles.title}>Itens do RPG</h1>
          <p className={styles.subtitle}>
            Crie e edite baseitems com nome, tipo e raridade.
          </p>
        </div>
        <Link href={`/rpg/${rpgId}/edit`} className={styles.backLink}>
          Voltar para edicao
        </Link>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionTopbar}>
          <h2 className={styles.sectionTitle}>Baseitems</h2>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={openCreateForm}
          >
            Criar item
          </button>
        </div>

        {isFormOpen ? (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h3>{isEditing ? "Editar item" : "Novo item"}</h3>

            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Tipo</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ItemType)}
              >
                {baseItemTypeValues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Raridade</span>
              <select
                value={rarity}
                onChange={(event) => setRarity(event.target.value as ItemRarity)}
              >
                {baseItemRarityValues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {submitError ? <p className={styles.error}>{submitError}</p> : null}

            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                {saving ? "Salvando..." : isEditing ? "Salvar item" : "Criar item"}
              </button>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={closeForm}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {loading ? <p className={styles.feedback}>Carregando itens...</p> : null}
        {loadingError ? <p className={styles.error}>{loadingError}</p> : null}

        {!loading && !loadingError && items.length === 0 ? (
          <p className={styles.feedback}>Nenhum item cadastrado para este RPG.</p>
        ) : null}

        {!loading && !loadingError && items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{item.name}</h3>
                  <span>{item.type}</span>
                </div>

                <p className={styles.rarityLine}>Raridade: {item.rarity}</p>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => openEditForm(item)}
                  >
                    Editar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  )
}
