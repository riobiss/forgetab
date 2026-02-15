"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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

type CharacterSummary = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  createdByUserId?: string | null
  statuses?: Record<string, number>
  attributes?: Record<string, number>
}

type CharactersPayload = {
  characters?: CharacterSummary[]
  message?: string
}

const CHARACTER_TYPE_LABEL: Record<CharacterSummary["characterType"], string> = {
  player: "Player",
  npc: "NPC",
  monster: "Monstro",
}

export default function NewCharacterPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rpgId = params.rpgId
  const characterId = searchParams.get("characterId")

  const [name, setName] = useState("")
  const [attributes, setAttributes] = useState<AttributeTemplate[]>([])
  const [statuses, setStatuses] = useState<StatusTemplate[]>([])
  const [values, setValues] = useState<Record<string, number>>({})
  const [statusValues, setStatusValues] = useState<Record<string, number>>({})
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null)
  const [characterType, setCharacterType] = useState<CharacterSummary["characterType"]>(
    "player",
  )
  const [characterVisibility, setCharacterVisibility] = useState<"private" | "public">(
    "public",
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        setError("")

        const [attributesResponse, statusesResponse, charactersResponse] = await Promise.all([
          fetch(`/api/rpg/${rpgId}/attributes`),
          fetch(`/api/rpg/${rpgId}/statuses`),
          fetch(`/api/rpg/${rpgId}/characters`),
        ])

        const attributesPayload = (await attributesResponse.json()) as TemplatePayload
        const statusesPayload = (await statusesResponse.json()) as StatusTemplatePayload
        const charactersPayload = (await charactersResponse.json()) as CharactersPayload

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

        if (!charactersResponse.ok) {
          setError(charactersPayload.message ?? "Nao foi possivel carregar os personagens.")
          return
        }

        const attributeTemplate = attributesPayload.attributes ?? []
        const statusTemplate = statusesPayload.statuses ?? []
        const allCharacters = charactersPayload.characters ?? []
        const editTarget = characterId
          ? allCharacters.find((character) => character.id === characterId)
          : null

        if (characterId && !editTarget) {
          setError("Personagem nao encontrado para edicao.")
          return
        }

        setAttributes(attributeTemplate)
        setStatuses(statusTemplate)

        const nextAttributes = attributeTemplate.reduce<Record<string, number>>((acc, item) => {
          acc[item.key] = Number((editTarget?.attributes ?? {})[item.key] ?? 0)
          return acc
        }, {})

        const nextStatuses = statusTemplate.reduce<Record<string, number>>((acc, item) => {
          acc[item.key] = Number((editTarget?.statuses ?? {})[item.key] ?? 0)
          return acc
        }, {})

        setValues(nextAttributes)
        setStatusValues(nextStatuses)
        setName(editTarget?.name ?? "")
        setCharacterType(editTarget?.characterType ?? "player")
        setCharacterVisibility(editTarget?.visibility ?? "public")
        setEditingCharacterId(editTarget?.id ?? null)
      } catch {
        setError("Erro de conexao ao carregar padroes de personagem.")
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) {
      void loadTemplate()
    }
  }, [characterId, rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError("")

    try {
      const isEditing = Boolean(editingCharacterId)
      const endpoint = isEditing
        ? `/api/rpg/${rpgId}/characters/${editingCharacterId}`
        : `/api/rpg/${rpgId}/characters`
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(isEditing ? {} : { characterType }),
          ...(isEditing ? { visibility: characterVisibility } : {}),
          statuses: statusValues,
          attributes: values,
        }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(
          payload.message ??
            (isEditing
              ? "Nao foi possivel atualizar personagem."
              : "Nao foi possivel criar personagem."),
        )
        return
      }

      router.push(`/rpg/${rpgId}/characters`)
      router.refresh()
    } catch {
      setError(
        editingCharacterId
          ? "Erro de conexao ao atualizar personagem."
          : "Erro de conexao ao criar personagem.",
      )
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
        <header className={styles.header}>
          <div>
            <h1>{editingCharacterId ? "Editar Personagem" : "Criar Personagem"}</h1>
            <p>Preencha os campos da ficha com os valores definidos no RPG.</p>
          </div>
          <div className={styles.badges}>
            <span>{statuses.length} status</span>
            <span>{attributes.length} atributos</span>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.section}>
            <h2>Identificacao</h2>
            <div className={styles.identityGrid}>
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
                {editingCharacterId ? (
                  <input type="text" value={CHARACTER_TYPE_LABEL[characterType]} readOnly />
                ) : (
                  <select
                    value={characterType}
                    onChange={(event) =>
                      setCharacterType(
                        event.target.value as CharacterSummary["characterType"],
                      )
                    }
                  >
                    <option value="player">Player</option>
                    <option value="npc">NPC</option>
                    <option value="monster">Monstro</option>
                  </select>
                )}
              </label>

              {editingCharacterId ? (
                <div className={styles.field}>
                  <span>Visibilidade</span>
                  <div className={styles.visibilityOptions}>
                    <button
                      type="button"
                      className={
                        characterVisibility === "public"
                          ? `${styles.visibilityOption} ${styles.visibilityOptionActive}`
                          : styles.visibilityOption
                      }
                      onClick={() => setCharacterVisibility("public")}
                    >
                      Publico
                    </button>
                    <button
                      type="button"
                      className={
                        characterVisibility === "private"
                          ? `${styles.visibilityOption} ${styles.visibilityOptionActive}`
                          : styles.visibilityOption
                      }
                      onClick={() => setCharacterVisibility("private")}
                    >
                      Privado
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Status</h2>
            <div className={styles.valuesGrid}>
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
            </div>
          </section>

          <section className={styles.section}>
            <h2>Atributos</h2>
            <div className={styles.valuesGrid}>
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
            </div>
          </section>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={saving || attributes.length === 0 || statuses.length === 0}
            >
              {saving
                ? editingCharacterId
                  ? "Salvando..."
                  : "Criando..."
                : editingCharacterId
                  ? "Salvar personagem"
                  : "Criar personagem"}
            </button>
            <Link href={`/rpg/${rpgId}/characters`}>Cancelar</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
