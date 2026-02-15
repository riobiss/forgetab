"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react"
import styles from "./page.module.css"
import { ATTRIBUTE_CATALOG } from "@/lib/rpg/attributeCatalog"
import { STATUS_CATALOG } from "@/lib/rpg/statusCatalog"

type Visibility = "private" | "public"

type RpgPayload = {
  rpg: {
    id: string
    title: string
    description: string
    visibility: Visibility
    useClassRaceBonuses?: boolean
  }
}

type IdentityTemplate = {
  key: string
  label: string
  position: number
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
}

type CharacterIdentityTemplate = {
  key: string
  label: string
  required: boolean
  position: number
}

export default function EditRpgPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("private")
  const [useClassRaceBonuses, setUseClassRaceBonuses] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  const [selectedAttributeKeys, setSelectedAttributeKeys] = useState<string[]>([])
  const [selectedStatusKeys, setSelectedStatusKeys] = useState<string[]>([])
  const [skillTemplates, setSkillTemplates] = useState<Array<{ key: string; label: string }>>([])
  const [newSkillLabel, setNewSkillLabel] = useState("")

  const [raceDrafts, setRaceDrafts] = useState<IdentityTemplate[]>([])
  const [classDrafts, setClassDrafts] = useState<IdentityTemplate[]>([])
  const [identityError, setIdentityError] = useState("")
  const [identitySuccess, setIdentitySuccess] = useState("")
  const [showAttributeList, setShowAttributeList] = useState(false)
  const [showStatusList, setShowStatusList] = useState(false)
  const [showSkillList, setShowSkillList] = useState(false)
  const [showRaceList, setShowRaceList] = useState(false)
  const [showClassList, setShowClassList] = useState(false)
  const [showCharacterIdentityList, setShowCharacterIdentityList] = useState(false)
  const [characterIdentityTemplates, setCharacterIdentityTemplates] = useState<
    CharacterIdentityTemplate[]
  >([])
  const [newIdentityLabel, setNewIdentityLabel] = useState("")

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true)
        setError("")

        const [rpgRes, attrRes, statusRes, skillRes, raceRes, classRes, characterIdentityRes] = await Promise.all([
          fetch(`/api/rpg/${rpgId}`),
          fetch(`/api/rpg/${rpgId}/attributes`),
          fetch(`/api/rpg/${rpgId}/statuses`),
          fetch(`/api/rpg/${rpgId}/skills`),
          fetch(`/api/rpg/${rpgId}/races`),
          fetch(`/api/rpg/${rpgId}/classes`),
          fetch(`/api/rpg/${rpgId}/character-identity`),
        ])

        const rpgPayload = (await rpgRes.json()) as RpgPayload & { message?: string }
        if (!rpgRes.ok) {
          setError(rpgPayload.message ?? "Voce nao pode editar este RPG.")
          setCanEdit(false)
          return
        }

        const attrPayload = (await attrRes.json()) as { attributes?: Array<{ key: string }> }
        const statusPayload = (await statusRes.json()) as { statuses?: Array<{ key: string }> }
        const skillPayload = (await skillRes.json()) as {
          skills?: Array<{ key: string; label: string }>
        }
        const racePayload = (await raceRes.json()) as { races?: IdentityTemplate[] }
        const classPayload = (await classRes.json()) as { classes?: IdentityTemplate[] }
        const characterIdentityPayload = (await characterIdentityRes.json()) as {
          message?: string
          fields?: CharacterIdentityTemplate[]
        }

        if (!characterIdentityRes.ok) {
          setError(characterIdentityPayload.message ?? "Nao foi possivel carregar identidade.")
          setCanEdit(false)
          return
        }

        setTitle(rpgPayload.rpg.title)
        setDescription(rpgPayload.rpg.description)
        setVisibility(rpgPayload.rpg.visibility)
        setUseClassRaceBonuses(Boolean(rpgPayload.rpg.useClassRaceBonuses))
        setSelectedAttributeKeys((attrPayload.attributes ?? []).map((item) => item.key))
        setSelectedStatusKeys((statusPayload.statuses ?? []).map((item) => item.key))
        setSkillTemplates((skillPayload.skills ?? []).map((item) => ({ key: item.key, label: item.label })))
        setRaceDrafts(
          (racePayload.races ?? []).map((item, index) => ({
            key: item.key,
            label: item.label,
            position: item.position ?? index,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
        setClassDrafts(
          (classPayload.classes ?? []).map((item, index) => ({
            key: item.key,
            label: item.label,
            position: item.position ?? index,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
        setCharacterIdentityTemplates(characterIdentityPayload.fields ?? [])
        setCanEdit(true)
      } catch {
        setError("Erro de conexao ao carregar RPG.")
        setCanEdit(false)
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) void loadAll()
  }, [rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, visibility, useClassRaceBonuses }),
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

  async function saveAttributeTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/attributes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributes: selectedAttributeKeys }),
    })
    if (!response.ok) throw new Error("Falha ao salvar atributos.")
  }

  async function saveStatusTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/statuses`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statuses: selectedStatusKeys }),
    })
    if (!response.ok) throw new Error("Falha ao salvar status.")
  }

  async function saveSkillTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: skillTemplates.map((item) => item.label),
      }),
    })
    if (!response.ok) throw new Error("Falha ao salvar pericias.")
  }

  async function saveCharacterIdentityTemplate() {
    const response = await fetch(`/api/rpg/${rpgId}/character-identity`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: characterIdentityTemplates.map((item) => ({
          label: item.label,
          required: item.required,
        })),
      }),
    })
    if (!response.ok) throw new Error("Falha ao salvar campos de identidade.")
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
            <Link href="/rpg">
              <ArrowLeft size={16} />
              <span>Voltar para RPGs</span>
            </Link>
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
          <Settings2 size={16} />
          <span>{showAdvanced ? "Ocultar opcoes avancadas" : "Opcoes avancadas"}</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced ? (
          <section className={styles.advancedSection}>
            <h2>Padroes do RPG</h2>
            <p>Defina atributos, status, pericias e se o RPG usa racas/classes.</p>

            <div className={styles.attributeTemplateSection}>
              <h3>Atributos</h3>
              <div className={styles.identityHeaderActions}>
                <button type="button" onClick={() => setShowAttributeList((prev) => !prev)}>
                  {showAttributeList ? "Ocultar atributos" : "Mostrar atributos"}
                </button>
              </div>
              {showAttributeList ? (
                <div className={styles.attributeGrid}>
                  {ATTRIBUTE_CATALOG.map((item) => (
                    <label key={item.key} className={styles.attributeOption}>
                      <input
                        type="checkbox"
                        checked={selectedAttributeKeys.includes(item.key)}
                        onChange={() =>
                          setSelectedAttributeKeys((prev) =>
                            prev.includes(item.key)
                              ? prev.filter((value) => value !== item.key)
                              : [...prev, item.key],
                          )
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await saveAttributeTemplate()
                      setIdentitySuccess("Padrao de atributos salvo.")
                      setIdentityError("")
                    } catch (error) {
                      setIdentityError(
                        error instanceof Error ? error.message : "Erro ao salvar atributos.",
                      )
                    }
                  }}
                >
                  <Save size={16} />
                  <span>Salvar atributos</span>
                </button>
              </div>
            </div>

            <div className={styles.attributeTemplateSection}>
              <h3>Status</h3>
              <div className={styles.identityHeaderActions}>
                <button type="button" onClick={() => setShowStatusList((prev) => !prev)}>
                  {showStatusList ? "Ocultar status" : "Mostrar status"}
                </button>
              </div>
              {showStatusList ? (
                <div className={styles.attributeGrid}>
                  {STATUS_CATALOG.map((item) => (
                    <label key={item.key} className={styles.attributeOption}>
                      <input
                        type="checkbox"
                        checked={selectedStatusKeys.includes(item.key)}
                        onChange={() =>
                          setSelectedStatusKeys((prev) =>
                            prev.includes(item.key)
                              ? prev.filter((value) => value !== item.key)
                              : [...prev, item.key],
                          )
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await saveStatusTemplate()
                      setIdentitySuccess("Padrao de status salvo.")
                      setIdentityError("")
                    } catch (error) {
                      setIdentityError(
                        error instanceof Error ? error.message : "Erro ao salvar status.",
                      )
                    }
                  }}
                >
                  <Save size={16} />
                  <span>Salvar status</span>
                </button>
              </div>
            </div>

            <div className={styles.attributeTemplateSection}>
              <h3>Pericias</h3>
              <div className={styles.identityHeaderActions}>
                <button type="button" onClick={() => setShowSkillList((prev) => !prev)}>
                  {showSkillList ? "Ocultar pericias" : "Mostrar pericias"}
                </button>
              </div>
              {showSkillList ? (
                <>
                  <div className={styles.actions}>
                    <input
                      type="text"
                      value={newSkillLabel}
                      onChange={(event) => setNewSkillLabel(event.target.value)}
                      placeholder="Ex.: medicina"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const label = newSkillLabel.trim()
                        if (label.length < 2) return
                        const key = label
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-+|-+$/g, "")
                        if (!key) return
                        setSkillTemplates((prev) =>
                          prev.some((item) => item.key === key || item.label === label)
                            ? prev
                            : [...prev, { key, label }],
                        )
                        setNewSkillLabel("")
                      }}
                    >
                      <Plus size={16} />
                      <span>Adicionar pericia</span>
                    </button>
                  </div>
                  {skillTemplates.map((item) => (
                    <div key={item.key} className={styles.actions}>
                      <span>{item.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSkillTemplates((prev) =>
                            prev.filter((current) => current.key !== item.key),
                          )
                        }
                      >
                        <Trash2 size={16} />
                        <span>Remover</span>
                      </button>
                    </div>
                  ))}
                </>
              ) : null}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await saveSkillTemplate()
                      setIdentitySuccess("Padrao de pericias salvo.")
                      setIdentityError("")
                    } catch (error) {
                      setIdentityError(
                        error instanceof Error ? error.message : "Erro ao salvar pericias.",
                      )
                    }
                  }}
                >
                  <Save size={16} />
                  <span>Salvar pericias</span>
                </button>
              </div>
            </div>

            <div className={styles.attributeTemplateSection}>
              <h3>Identidade do Player</h3>
              <p>Defina os campos de identificacao que o Player precisa preencher.</p>
              <div className={styles.identityHeaderActions}>
                <button
                  type="button"
                  onClick={() => setShowCharacterIdentityList((prev) => !prev)}
                >
                  {showCharacterIdentityList ? "Ocultar campos" : "Mostrar campos"}
                </button>
              </div>
              {showCharacterIdentityList ? (
                <>
                  <div className={styles.actions}>
                    <input
                      type="text"
                      value={newIdentityLabel}
                      onChange={(event) => setNewIdentityLabel(event.target.value)}
                      placeholder="Ex.: Sobrenome"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const label = newIdentityLabel.trim()
                        if (label.length < 2) return
                        setCharacterIdentityTemplates((prev) => [
                          ...prev,
                          {
                            key: `draft-${crypto.randomUUID()}`,
                            label,
                            required: true,
                            position: prev.length,
                          },
                        ])
                        setNewIdentityLabel("")
                      }}
                    >
                      <Plus size={16} />
                      <span>Adicionar campo</span>
                    </button>
                  </div>
                  {characterIdentityTemplates.length === 0 ? (
                    <p>Nenhum campo configurado.</p>
                  ) : null}
                  {characterIdentityTemplates.map((field, index) => (
                    <div key={field.key} className={styles.actions}>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(event) =>
                          setCharacterIdentityTemplates((prev) =>
                            prev.map((item, currentIndex) =>
                              currentIndex === index
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <label className={styles.attributeOption}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            setCharacterIdentityTemplates((prev) =>
                              prev.map((item, currentIndex) =>
                                currentIndex === index
                                  ? { ...item, required: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        <span>Obrigatorio</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCharacterIdentityTemplates((prev) =>
                            prev.filter((_, currentIndex) => currentIndex !== index),
                          )
                        }
                      >
                        <Trash2 size={16} />
                        <span>Remover</span>
                      </button>
                    </div>
                  ))}
                </>
              ) : null}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await saveCharacterIdentityTemplate()
                      setIdentitySuccess("Campos de identidade salvos.")
                      setIdentityError("")
                    } catch (error) {
                      setIdentityError(
                        error instanceof Error
                          ? error.message
                          : "Erro ao salvar campos de identidade.",
                      )
                    }
                  }}
                >
                  <Save size={16} />
                  <span>Salvar identidade</span>
                </button>
              </div>
            </div>

            <div className={styles.attributeTemplateSection}>
              <h3>Racas e Classes</h3>
              <label className={styles.attributeOption}>
                <input
                  type="checkbox"
                  checked={useClassRaceBonuses}
                  onChange={(event) => setUseClassRaceBonuses(event.target.checked)}
                />
                <span>Usar racas/classes na criacao de personagem</span>
              </label>
            </div>

            {useClassRaceBonuses ? (
              <>
                <div className={styles.attributeTemplateSection}>
                  <h3>Racas</h3>
                  <div className={styles.identityHeaderActions}>
                    <button
                      type="button"
                      onClick={() => setShowRaceList((prev) => !prev)}
                    >
                      {showRaceList ? "Ocultar nomes" : "Mostrar nomes"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() =>
                        router.push(`/rpg/${rpgId}/edit/advanced/race/new`)
                      }
                    >
                      <Plus size={16} />
                      <span>Criar nova raca</span>
                    </button>
                  </div>

                  {showRaceList ? (
                    <ul className={styles.identityNameList}>
                      {raceDrafts.length === 0 ? <li>Nenhuma raca cadastrada.</li> : null}
                      {raceDrafts.map((draft) => (
                        <li key={draft.key} className={styles.identityNameListItem}>
                          <span>{draft.label.trim() || "Sem nome"}</span>
                          <div className={styles.identityItemActions}>
                            <Link
                              className={styles.secondaryButton}
                              href={`/rpg/${rpgId}/edit/advanced/race/${draft.key}`}
                            >
                              Avancado
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className={styles.attributeTemplateSection}>
                  <h3>Classes</h3>
                  <div className={styles.identityHeaderActions}>
                    <button
                      type="button"
                      onClick={() => setShowClassList((prev) => !prev)}
                    >
                      {showClassList ? "Ocultar nomes" : "Mostrar nomes"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() =>
                        router.push(`/rpg/${rpgId}/edit/advanced/class/new`)
                      }
                    >
                      <Plus size={16} />
                      <span>Criar nova classe</span>
                    </button>
                  </div>

                  {showClassList ? (
                    <ul className={styles.identityNameList}>
                      {classDrafts.length === 0 ? <li>Nenhuma classe cadastrada.</li> : null}
                      {classDrafts.map((draft) => (
                        <li key={draft.key} className={styles.identityNameListItem}>
                          <span>{draft.label.trim() || "Sem nome"}</span>
                          <div className={styles.identityItemActions}>
                            <Link
                              className={styles.secondaryButton}
                              href={`/rpg/${rpgId}/edit/advanced/class/${draft.key}`}
                            >
                              Avancado
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </>
            ) : null}

            {identityError ? <p className={styles.error}>{identityError}</p> : null}
            {identitySuccess ? <p className={styles.success}>{identitySuccess}</p> : null}
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
              onChange={(event) => setVisibility(event.target.value as "private" | "public")}
            >
              <option value="private">Privado</option>
              <option value="public">Publico</option>
            </select>
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle size={16} className={styles.spin} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Salvar alteracoes</span>
                </>
              )}
            </button>
            <Link href="/rpg">
              <X size={16} />
              <span>Cancelar</span>
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
