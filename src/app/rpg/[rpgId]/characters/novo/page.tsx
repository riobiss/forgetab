"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./page.module.css"

type AttributeTemplate = {
  key: string
  label: string
  position: number
}

type TemplatePayload = {
  attributes?: AttributeTemplate[]
  message?: string
}

type StatusTemplate = {
  key: string
  label: string
  position: number
}

type StatusTemplatePayload = {
  statuses?: StatusTemplate[]
  message?: string
}

export default function NewCharacterPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId

  const [name, setName] = useState("")
  const [characterType, setCharacterType] = useState<"player" | "npc" | "monster">("player")
  const [attributes, setAttributes] = useState<AttributeTemplate[]>([])
  const [statuses, setStatuses] = useState<StatusTemplate[]>([])
  const [values, setValues] = useState<Record<string, number>>({})
  const [statusValues, setStatusValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        setError("")

        const [attributesResponse, statusesResponse] = await Promise.all([
          fetch(`/api/rpg/${rpgId}/attributes`),
          fetch(`/api/rpg/${rpgId}/statuses`),
        ])

        const attributesPayload = (await attributesResponse.json()) as TemplatePayload
        const statusesPayload = (await statusesResponse.json()) as StatusTemplatePayload

        if (!attributesResponse.ok) {
          setError(
            attributesPayload.message ?? "Nao foi possivel carregar o padrao de atributos.",
          )
          return
        }

        if (!statusesResponse.ok) {
          setError(statusesPayload.message ?? "Nao foi possivel carregar o padrao de status.")
          return
        }

        const attributeTemplate = attributesPayload.attributes ?? []
        const statusTemplate = statusesPayload.statuses ?? []
        setAttributes(attributeTemplate)
        setStatuses(statusTemplate)

        setValues(
          attributeTemplate.reduce<Record<string, number>>((acc, item) => {
            acc[item.key] = 0
            return acc
          }, {}),
        )

        setStatusValues(
          statusTemplate.reduce<Record<string, number>>((acc, item) => {
            acc[item.key] = 0
            return acc
          }, {}),
        )
      } catch {
        setError("Erro de conexao ao carregar padroes de personagem.")
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) {
      void loadTemplate()
    }
  }, [rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          characterType,
          statuses: statusValues,
          attributes: values,
        }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel criar personagem.")
        return
      }

      router.push(`/rpg/${rpgId}/characters`)
      router.refresh()
    } catch {
      setError("Erro de conexao ao criar personagem.")
    } finally {
      setSaving(false)
    }
  }

  function updateAttribute(key: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [key]: Number(value),
    }))
  }

  function updateStatus(key: string, value: string) {
    setStatusValues((prev) => ({
      ...prev,
      [key]: Number(value),
    }))
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p>Carregando padrao de atributos...</p>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Novo Personagem</h1>
        <p>Preencha os atributos definidos no modo avancado do RPG.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
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
              value={characterType}
              onChange={(event) =>
                setCharacterType(event.target.value as "player" | "npc" | "monster")
              }
              required
            >
              <option value="player">Player</option>
              <option value="npc">NPC</option>
              <option value="monster">Monstro</option>
            </select>
          </label>

          {statuses.map((status) => (
            <label className={styles.field} key={status.key}>
              <span>{status.label}</span>
              <input
                type="number"
                min={0}
                value={statusValues[status.key] ?? 0}
                onChange={(event) => updateStatus(status.key, event.target.value)}
                required
              />
            </label>
          ))}

          {attributes.map((attribute) => (
            <label className={styles.field} key={attribute.key}>
              <span>{attribute.label}</span>
              <input
                type="number"
                value={values[attribute.key] ?? 0}
                onChange={(event) => updateAttribute(attribute.key, event.target.value)}
                required
              />
            </label>
          ))}

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={saving || attributes.length === 0 || statuses.length === 0}
            >
              {saving ? "Criando..." : "Criar personagem"}
            </button>
            <Link href={`/rpg/${rpgId}/characters`}>Cancelar</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
