"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import styles from "./page.module.css"
import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"

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

type SkillTemplate = {
  key: string
  label: string
  position: number
}

type SkillTemplatePayload = {
  skills?: SkillTemplate[]
  message?: string
}

type RpgConfigPayload = {
  rpg?: {
    useClassRaceBonuses?: boolean
  }
  message?: string
}

type IdentityTemplate = {
  key: string
  label: string
}

type RacesPayload = {
  races?: IdentityTemplate[]
  message?: string
}

type ClassesPayload = {
  classes?: IdentityTemplate[]
  message?: string
}

type CharacterIdentityTemplate = {
  key: string
  label: string
  required: boolean
  position: number
}

type CharacterIdentityPayload = {
  fields?: CharacterIdentityTemplate[]
  message?: string
}

type CharacterCharacteristicsPayload = {
  fields?: CharacterIdentityTemplate[]
  message?: string
}

type CharacterSummary = {
  id: string
  name: string
  image?: string | null
  raceKey?: string | null
  classKey?: string | null
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  createdByUserId?: string | null
  statuses?: Record<string, number>
  attributes?: Record<string, number>
  skills?: Record<string, number>
  identity?: Record<string, string>
  characteristics?: Record<string, string>
}

type CharactersPayload = {
  characters?: CharacterSummary[]
  isOwner?: boolean
  message?: string
}

type UploadImagePayload = {
  message?: string
  url?: string
}

function isIdentityNameField(field: CharacterIdentityTemplate) {
  const normalizedLabel = field.label.trim().toLowerCase()
  return (
    field.key === "nome" ||
    field.key === "name" ||
    normalizedLabel === "nome" ||
    normalizedLabel === "name"
  )
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
  const [image, setImage] = useState("")
  const [attributes, setAttributes] = useState<AttributeTemplate[]>([])
  const [statuses, setStatuses] = useState<StatusTemplate[]>([])
  const [skills, setSkills] = useState<SkillTemplate[]>([])
  const [values, setValues] = useState<Record<string, number>>({})
  const [statusValues, setStatusValues] = useState<Record<string, number>>({})
  const [skillValues, setSkillValues] = useState<Record<string, number>>({})
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null)
  const [useClassRaceBonuses, setUseClassRaceBonuses] = useState(false)
  const [raceTemplates, setRaceTemplates] = useState<IdentityTemplate[]>([])
  const [classTemplates, setClassTemplates] = useState<IdentityTemplate[]>([])
  const [identityTemplates, setIdentityTemplates] = useState<CharacterIdentityTemplate[]>([])
  const [identityValues, setIdentityValues] = useState<Record<string, string>>({})
  const [characteristicsTemplates, setCharacteristicsTemplates] = useState<CharacterIdentityTemplate[]>([])
  const [characteristicsValues, setCharacteristicsValues] = useState<Record<string, string>>({})
  const [raceKey, setRaceKey] = useState("")
  const [classKey, setClassKey] = useState("")
  const [characterType, setCharacterType] = useState<CharacterSummary["characterType"]>(
    "player",
  )
  const [characterVisibility, setCharacterVisibility] = useState<"private" | "public">(
    "public",
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [error, setError] = useState("")
  const [isOwner, setIsOwner] = useState(false)
  const [showStatusSection, setShowStatusSection] = useState(true)
  const [showAttributeSection, setShowAttributeSection] = useState(true)
  const [showSkillSection, setShowSkillSection] = useState(true)
  const identityNameField = identityTemplates.find((field) => isIdentityNameField(field)) ?? null

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        setError("")

        const [attributesResponse, statusesResponse, skillsResponse, charactersResponse, rpgResponse, racesResponse, classesResponse, identityResponse, characteristicsResponse] = await Promise.all([
          fetch(`/api/rpg/${rpgId}/attributes`),
          fetch(`/api/rpg/${rpgId}/statuses`),
          fetch(`/api/rpg/${rpgId}/skills`),
          fetch(`/api/rpg/${rpgId}/characters`),
          fetch(`/api/rpg/${rpgId}`),
          fetch(`/api/rpg/${rpgId}/races`),
          fetch(`/api/rpg/${rpgId}/classes`),
          fetch(`/api/rpg/${rpgId}/character-identity`),
          fetch(`/api/rpg/${rpgId}/character-characteristics`),
        ])

        const attributesPayload = (await attributesResponse.json()) as TemplatePayload
        const statusesPayload = (await statusesResponse.json()) as StatusTemplatePayload
        const skillsPayload = (await skillsResponse.json()) as SkillTemplatePayload
        const charactersPayload = (await charactersResponse.json()) as CharactersPayload
        const rpgPayload = (await rpgResponse.json()) as RpgConfigPayload
        const racesPayload = (await racesResponse.json()) as RacesPayload
        const classesPayload = (await classesResponse.json()) as ClassesPayload
        const identityPayload = (await identityResponse.json()) as CharacterIdentityPayload
        const characteristicsPayload = (await characteristicsResponse.json()) as CharacterCharacteristicsPayload

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

        if (!skillsResponse.ok) {
          setError(skillsPayload.message ?? "Nao foi possivel carregar o padrao de pericias.")
          return
        }

        if (!charactersResponse.ok) {
          setError(charactersPayload.message ?? "Nao foi possivel carregar os personagens.")
          return
        }
        if (!rpgResponse.ok) {
          setError(rpgPayload.message ?? "Nao foi possivel carregar configuracoes do RPG.")
          return
        }
        if (!racesResponse.ok) {
          setError(racesPayload.message ?? "Nao foi possivel carregar racas.")
          return
        }
        if (!classesResponse.ok) {
          setError(classesPayload.message ?? "Nao foi possivel carregar classes.")
          return
        }
        if (!identityResponse.ok) {
          setError(identityPayload.message ?? "Nao foi possivel carregar campos de identidade.")
          return
        }
        if (!characteristicsResponse.ok) {
          setError(
            characteristicsPayload.message ?? "Nao foi possivel carregar campos de caracteristicas.",
          )
          return
        }

        const attributeTemplate = attributesPayload.attributes ?? []
        const statusTemplate = statusesPayload.statuses ?? []
        const skillTemplate = skillsPayload.skills ?? []
        const races = racesPayload.races ?? []
        const classes = classesPayload.classes ?? []
        const identityFields = identityPayload.fields ?? []
        const characteristicsFields = characteristicsPayload.fields ?? []
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
        setSkills(skillTemplate)
        setRaceTemplates(races)
        setClassTemplates(classes)
        setIdentityTemplates(identityFields)
        setCharacteristicsTemplates(characteristicsFields)
        setUseClassRaceBonuses(Boolean(rpgPayload.rpg?.useClassRaceBonuses))
        setIsOwner(Boolean(charactersPayload.isOwner))

        const nextAttributes = attributeTemplate.reduce<Record<string, number>>((acc, item) => {
          acc[item.key] = Number((editTarget?.attributes ?? {})[item.key] ?? 0)
          return acc
        }, {})

        const nextStatuses = statusTemplate.reduce<Record<string, number>>((acc, item) => {
          acc[item.key] = Number((editTarget?.statuses ?? {})[item.key] ?? 0)
          return acc
        }, {})
        const nextSkills = skillTemplate.reduce<Record<string, number>>((acc, item) => {
          acc[item.key] = Number((editTarget?.skills ?? {})[item.key] ?? 0)
          return acc
        }, {})
        const nextIdentity = identityFields.reduce<Record<string, string>>((acc, item) => {
          const value = editTarget?.identity?.[item.key]
          acc[item.key] =
            typeof value === "string"
              ? value
              : isIdentityNameField(item)
                ? (editTarget?.name ?? "")
                : ""
          return acc
        }, {})
        const nextCharacteristics = characteristicsFields.reduce<Record<string, string>>((acc, item) => {
          const value = editTarget?.characteristics?.[item.key]
          acc[item.key] = typeof value === "string" ? value : ""
          return acc
        }, {})

        setValues(nextAttributes)
        setStatusValues(nextStatuses)
        setSkillValues(nextSkills)
        setIdentityValues(nextIdentity)
        setCharacteristicsValues(nextCharacteristics)
        setName(editTarget?.name ?? "")
        setImage(editTarget?.image ?? "")
        setRaceKey(editTarget?.raceKey ?? "")
        setClassKey(editTarget?.classKey ?? "")
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
      const resolvedName = identityNameField
        ? (identityValues[identityNameField.key] ?? "").trim()
        : name.trim()

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resolvedName,
          image,
          ...(isEditing
            ? {}
            : useClassRaceBonuses
              ? {
                  ...(raceKey ? { raceKey } : {}),
                  ...(classKey ? { classKey } : {}),
                }
              : {}),
          ...(isEditing ? {} : { characterType }),
          ...(isEditing ? { visibility: characterVisibility } : {}),
          statuses: statusValues,
          attributes: values,
          identity: identityValues,
          characteristics: characteristicsValues,
          ...(isOwner ? { skills: skillValues } : {}),
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

  function updateSkill(key: string, value: string) {
    setSkillValues((prev) => ({
      ...prev,
      [key]: Number(value),
    }))
  }

  function updateIdentityField(key: string, value: string) {
    setIdentityValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  function updateCharacteristicsField(key: string, value: string) {
    setCharacteristicsValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleImageUpload(file: File) {
    setUploadingImage(true)
    setUploadError("")
    setError("")

    try {
      const payload = new FormData()
      payload.append("file", file)
      if (image.trim()) {
        payload.append("oldUrl", image.trim())
      }

      const response = await fetch("/api/uploads/character-image", {
        method: "POST",
        body: payload,
      })

      const body = (await response.json()) as UploadImagePayload
      if (!response.ok || !body.url) {
        setUploadError(body.message ?? "Nao foi possivel enviar imagem.")
        return
      }

      setImage(body.url)
    } catch {
      setUploadError("Erro de conexao ao enviar imagem.")
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleDeleteCharacter() {
    if (!editingCharacterId) return

    setDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/characters/${editingCharacterId}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel deletar personagem.")
        return
      }

      router.push(`/rpg/${rpgId}/characters`)
      router.refresh()
    } catch {
      setError("Erro de conexao ao deletar personagem.")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
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
            <span>{skills.length} pericias</span>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.section}>
            <h2>Identificacao</h2>
            <div className={styles.identityGrid}>
              {!identityNameField ? (
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
              ) : null}

              <label className={styles.field}>
                <span>Imagem (URL)</span>
                <input
                  type="url"
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  readOnly
                  placeholder="https://ik.imagekit.io/.../personagem.jpg"
                />
              </label>

              <label className={styles.field}>
                <span>Arquivo da imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleImageUpload(file)
                    }
                  }}
                />
              </label>
              {uploadingImage ? <p>Enviando imagem...</p> : null}
              {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

              {useClassRaceBonuses ? (
                <>
                  {raceTemplates.length > 0 ? (
                    <label className={styles.field}>
                      <span>Raca</span>
                      {editingCharacterId ? (
                        <input
                          type="text"
                          value={
                            raceTemplates.find((item) => item.key === raceKey)?.label ??
                            "Sem raca"
                          }
                          readOnly
                        />
                      ) : (
                        <select
                          value={raceKey}
                          onChange={(event) => setRaceKey(event.target.value)}
                        >
                          <option value="">Sem raca</option>
                          {raceTemplates.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </label>
                  ) : null}

                  {classTemplates.length > 0 ? (
                    <label className={styles.field}>
                      <span>Classe</span>
                      {editingCharacterId ? (
                        <input
                          type="text"
                          value={
                            classTemplates.find((item) => item.key === classKey)?.label ??
                            "Sem classe"
                          }
                          readOnly
                        />
                      ) : (
                        <select
                          value={classKey}
                          onChange={(event) => setClassKey(event.target.value)}
                        >
                          <option value="">Sem classe</option>
                          {classTemplates.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </label>
                  ) : null}
                </>
              ) : null}

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

              {identityTemplates.map((field) => (
                <label className={styles.field} key={`identity-${field.key}`}>
                  <span>{field.label}</span>
                  <input
                    type="text"
                    value={identityValues[field.key] ?? ""}
                    onChange={(event) => updateIdentityField(field.key, event.target.value)}
                    required={field.required}
                  />
                </label>
              ))}

            </div>
          </section>

          {characteristicsTemplates.length > 0 ? (
            <section className={styles.section}>
              <h2>Caracteristicas</h2>
              <div className={styles.identityGrid}>
                {characteristicsTemplates.map((field) => (
                  <label className={styles.field} key={`characteristics-${field.key}`}>
                    <span>{field.label}</span>
                    <input
                      type="text"
                      value={characteristicsValues[field.key] ?? ""}
                      onChange={(event) => updateCharacteristicsField(field.key, event.target.value)}
                      required={field.required}
                    />
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Status</h2>
              <button
                type="button"
                className={styles.sectionToggleButton}
                onClick={() => setShowStatusSection((prev) => !prev)}
              >
                {showStatusSection ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {showStatusSection ? (
              <NumericTemplateGrid
                items={statuses.map((status) => ({
                  key: status.key,
                  label: status.label,
                }))}
                values={statusValues}
                onChange={updateStatus}
                gridClassName={styles.valuesGrid}
                fieldClassName={styles.field}
                keyPrefix="character-status"
                min={0}
                required
              />
            ) : null}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Atributos</h2>
              <button
                type="button"
                className={styles.sectionToggleButton}
                onClick={() => setShowAttributeSection((prev) => !prev)}
              >
                {showAttributeSection ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {showAttributeSection ? (
              <NumericTemplateGrid
                items={attributes.map((attribute) => ({
                  key: attribute.key,
                  label: attribute.label,
                }))}
                values={values}
                onChange={updateAttribute}
                gridClassName={styles.valuesGrid}
                fieldClassName={styles.field}
                keyPrefix="character-attribute"
                required
              />
            ) : null}
          </section>

          {skills.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Pericias</h2>
                <button
                  type="button"
                  className={styles.sectionToggleButton}
                  onClick={() => setShowSkillSection((prev) => !prev)}
                >
                  {showSkillSection ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {showSkillSection ? (
                <>
                  {!isOwner ? (
                    <p>Somente o owner do RPG pode editar as pericias dos personagens.</p>
                  ) : null}
                  <NumericTemplateGrid
                    items={skills.map((skill) => ({
                      key: skill.key,
                      label: skill.label,
                    }))}
                    values={skillValues}
                    onChange={updateSkill}
                    gridClassName={styles.valuesGrid}
                    fieldClassName={styles.field}
                    keyPrefix="character-skill"
                    min={0}
                    disabled={!isOwner}
                    required
                  />
                </>
              ) : null}
            </section>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={
                saving ||
                attributes.length === 0 ||
                statuses.length === 0
              }
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
            {editingCharacterId ? (
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
              >
                Deletar personagem
              </button>
            ) : null}
          </div>

          {editingCharacterId && showDeleteConfirm ? (
            <div className={styles.deleteNotice}>
              <p>Tem certeza que deseja deletar este personagem?</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => void handleDeleteCharacter()}
                  disabled={deleting}
                >
                  {deleting ? "Deletando..." : "Confirmar exclusao"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  )
}
