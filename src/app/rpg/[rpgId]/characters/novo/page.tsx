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

export default function NewCharacterPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId

  const [name, setName] = useState("")
  const [attributes, setAttributes] = useState<AttributeTemplate[]>([])
  const [values, setValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(`/api/rpg/${rpgId}/attributes`)
        const payload = (await response.json()) as TemplatePayload

        if (!response.ok) {
          setError(payload.message ?? "Nao foi possivel carregar o padrao de atributos.")
          return
        }

        const template = payload.attributes ?? []
        setAttributes(template)

        setValues(
          template.reduce<Record<string, number>>((acc, item) => {
            acc[item.key] = 0
            return acc
          }, {}),
        )
      } catch {
        setError("Erro de conexao ao carregar padrao de atributos.")
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
        body: JSON.stringify({ name, attributes: values }),
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
            <button type="submit" disabled={saving || attributes.length === 0}>
              {saving ? "Criando..." : "Criar personagem"}
            </button>
            <Link href={`/rpg/${rpgId}/characters`}>Cancelar</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
