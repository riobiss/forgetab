"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./page.module.css"
import { ATTRIBUTE_CATALOG } from "@/lib/rpg/attributeCatalog"

type Visibility = "private" | "public"

type RpgPayload = {
  rpg: {
    id: string
    title: string
    description: string
    visibility: Visibility
  }
}

type AttributeTemplatePayload = {
  attributes?: Array<{
    key: string
    label: string
    position: number
  }>
  message?: string
}

export default function EditRpgPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("private")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  const [selectedAttributeKeys, setSelectedAttributeKeys] = useState<string[]>([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [attributesSaving, setAttributesSaving] = useState(false)
  const [attributesError, setAttributesError] = useState("")
  const [attributesSuccess, setAttributesSuccess] = useState("")

  const selectedCount = useMemo(
    () => selectedAttributeKeys.length,
    [selectedAttributeKeys],
  )

  useEffect(() => {
    async function loadRpg() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(`/api/rpg/${rpgId}`)
        const payload = (await response.json()) as RpgPayload & { message?: string }

        if (!response.ok) {
          setError(payload.message ?? "Voce nao pode editar este RPG.")
          setCanEdit(false)
          return
        }

        setTitle(payload.rpg.title)
        setDescription(payload.rpg.description)
        setVisibility(payload.rpg.visibility)
        setCanEdit(true)
      } catch {
        setError("Erro de conexao ao carregar RPG.")
        setCanEdit(false)
      } finally {
        setLoading(false)
      }
    }

    async function loadAttributeTemplate() {
      try {
        setAttributesLoading(true)
        setAttributesError("")

        const response = await fetch(`/api/rpg/${rpgId}/attributes`)
        const payload = (await response.json()) as AttributeTemplatePayload

        if (!response.ok) {
          setAttributesError(payload.message ?? "Nao foi possivel carregar atributos.")
          return
        }

        const keys = (payload.attributes ?? []).map((item) => item.key)
        setSelectedAttributeKeys(keys)
      } catch {
        setAttributesError("Erro de conexao ao carregar atributos.")
      } finally {
        setAttributesLoading(false)
      }
    }

    if (rpgId) {
      void loadRpg()
      void loadAttributeTemplate()
    }
  }, [rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, visibility }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel atualizar o RPG.")
        return
      }

      router.push("/rpg")
      router.refresh()
    } catch {
      setError("Erro de conexao ao atualizar RPG.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAttributes() {
    setAttributesSaving(true)
    setAttributesError("")
    setAttributesSuccess("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/attributes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: selectedAttributeKeys }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setAttributesError(payload.message ?? "Nao foi possivel salvar os atributos.")
        return
      }

      setAttributesSuccess("Padrao de atributos salvo com sucesso.")
    } catch {
      setAttributesError("Erro de conexao ao salvar atributos.")
    } finally {
      setAttributesSaving(false)
    }
  }

  function toggleAttribute(key: string) {
    setAttributesSuccess("")
    setSelectedAttributeKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key)
      }

      return [...prev, key]
    })
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p>Carregando RPG...</p>
        </section>
      </main>
    )
  }

  if (!canEdit) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Edicao bloqueada</h1>
          <p className={styles.error}>{error || "Voce nao pode editar este RPG."}</p>
          <div className={styles.actions}>
            <Link href="/rpg">Voltar para RPGs</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Editar RPG</h1>
        <p>Atualize as informacoes iniciais da campanha.</p>

        <button
          type="button"
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced((prev) => !prev)}
        >
          {showAdvanced ? "Ocultar opcoes avancadas" : "Opcoes avancadas"}
        </button>

        {showAdvanced ? (
          <section className={styles.advancedSection}>
            <h2>Sessoes do RPG</h2>
            <p>Crie e organize secoes principais da campanha.</p>

            <div className={styles.advancedGrid}>
              <Link href={`/rpg/${rpgId}/characters`}>Sessao de Personagens</Link>
              <Link href={`/rpg/${rpgId}/classes`}>Sessao de Classes</Link>
              <Link href={`/rpg/${rpgId}/items`}>Sessao de Itens</Link>
            </div>

            <div className={styles.attributeTemplateSection}>
              <h3>Padrao de Atributos do RPG</h3>
              <p>
                Todo personagem novo deste RPG deve preencher estes atributos.
              </p>

              {attributesLoading ? <p>Carregando atributos...</p> : null}

              {!attributesLoading ? (
                <div className={styles.attributeGrid}>
                  {ATTRIBUTE_CATALOG.map((item) => {
                    const checked = selectedAttributeKeys.includes(item.key)

                    return (
                      <label key={item.key} className={styles.attributeOption}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAttribute(item.key)}
                        />
                        <span>{item.label}</span>
                      </label>
                    )
                  })}
                </div>
              ) : null}

              <div className={styles.attributeActions}>
                <span>{selectedCount} atributo(s) selecionado(s)</span>
                <button
                  type="button"
                  onClick={handleSaveAttributes}
                  disabled={attributesSaving || attributesLoading}
                >
                  {attributesSaving ? "Salvando..." : "Salvar padrao"}
                </button>
              </div>

              {attributesError ? <p className={styles.error}>{attributesError}</p> : null}
              {attributesSuccess ? <p className={styles.success}>{attributesSuccess}</p> : null}
            </div>
          </section>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Titulo</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Descricao</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={10}
              rows={5}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Visibilidade</span>
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "private" | "public")
              }
            >
              <option value="private">Privado</option>
              <option value="public">Publico</option>
            </select>
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>

            <Link href="/rpg">Cancelar</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
