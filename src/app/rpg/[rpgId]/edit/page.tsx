"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./page.module.css"
import { ATTRIBUTE_CATALOG } from "@/lib/rpg/attributeCatalog"
import { STATUS_CATALOG } from "@/lib/rpg/statusCatalog"
import IdentityTemplateForm from "./components/IdentityTemplateForm"

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

type IdentityTemplateDraft = {
  key: string
  label: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
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

  const [raceDrafts, setRaceDrafts] = useState<IdentityTemplateDraft[]>([])
  const [classDrafts, setClassDrafts] = useState<IdentityTemplateDraft[]>([])
  const [identityError, setIdentityError] = useState("")
  const [identitySuccess, setIdentitySuccess] = useState("")
  const [showRaceList, setShowRaceList] = useState(false)
  const [showClassList, setShowClassList] = useState(false)
  const [activeRaceKey, setActiveRaceKey] = useState<string | null>(null)
  const [activeClassKey, setActiveClassKey] = useState<string | null>(null)
  const [creatingRace, setCreatingRace] = useState(false)
  const [creatingClass, setCreatingClass] = useState(false)

  const attributeLabelByKey = useMemo<Map<string, string>>(
    () => new Map(ATTRIBUTE_CATALOG.map((item) => [item.key, item.label])),
    [],
  )

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true)
        setError("")

        const [rpgRes, attrRes, statusRes, skillRes, raceRes, classRes] = await Promise.all([
          fetch(`/api/rpg/${rpgId}`),
          fetch(`/api/rpg/${rpgId}/attributes`),
          fetch(`/api/rpg/${rpgId}/statuses`),
          fetch(`/api/rpg/${rpgId}/skills`),
          fetch(`/api/rpg/${rpgId}/races`),
          fetch(`/api/rpg/${rpgId}/classes`),
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

        setTitle(rpgPayload.rpg.title)
        setDescription(rpgPayload.rpg.description)
        setVisibility(rpgPayload.rpg.visibility)
        setUseClassRaceBonuses(Boolean(rpgPayload.rpg.useClassRaceBonuses))
        setSelectedAttributeKeys((attrPayload.attributes ?? []).map((item) => item.key))
        setSelectedStatusKeys((statusPayload.statuses ?? []).map((item) => item.key))
        setSkillTemplates((skillPayload.skills ?? []).map((item) => ({ key: item.key, label: item.label })))
        setRaceDrafts(
          (racePayload.races ?? []).map((item) => ({
            key: item.key,
            label: item.label,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
        setClassDrafts(
          (classPayload.classes ?? []).map((item) => ({
            key: item.key,
            label: item.label,
            attributeBonuses: item.attributeBonuses ?? {},
            skillBonuses: item.skillBonuses ?? {},
          })),
        )
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

  useEffect(() => {
    const skillKeys = skillTemplates.map((item) => item.key)

    setRaceDrafts((prev) =>
      prev.map((item) => ({
        ...item,
        attributeBonuses: selectedAttributeKeys.reduce<Record<string, number>>((acc, key) => {
          acc[key] = Number(item.attributeBonuses[key] ?? 0)
          return acc
        }, {}),
        skillBonuses: skillKeys.reduce<Record<string, number>>((acc, key) => {
          acc[key] = Number(item.skillBonuses[key] ?? 0)
          return acc
        }, {}),
      })),
    )

    setClassDrafts((prev) =>
      prev.map((item) => ({
        ...item,
        attributeBonuses: selectedAttributeKeys.reduce<Record<string, number>>((acc, key) => {
          acc[key] = Number(item.attributeBonuses[key] ?? 0)
          return acc
        }, {}),
        skillBonuses: skillKeys.reduce<Record<string, number>>((acc, key) => {
          acc[key] = Number(item.skillBonuses[key] ?? 0)
          return acc
        }, {}),
      })),
    )
  }, [selectedAttributeKeys, skillTemplates])

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

  async function saveIdentityTemplates(
    type: "race" | "class",
    draftsOverride?: IdentityTemplateDraft[],
  ) {
    setIdentityError("")
    setIdentitySuccess("")

    const drafts = draftsOverride ?? (type === "race" ? raceDrafts : classDrafts)
    const payload: Array<{
      label: string
      attributeBonuses: Record<string, number>
      skillBonuses: Record<string, number>
    }> = []

    for (const draft of drafts) {
      const label = draft.label.trim()
      if (label.length < 2) {
        setIdentityError(`Toda ${type === "race" ? "raca" : "classe"} precisa de nome com 2+ caracteres.`)
        return
      }

      const parsedAttributes = selectedAttributeKeys.reduce<Record<string, number>>(
        (acc, key) => {
          acc[key] = Math.floor(Number(draft.attributeBonuses[key] ?? 0))
          return acc
        },
        {},
      )

      const hasInvalidAttribute = Object.values(parsedAttributes).some((value) => !Number.isFinite(value))
      if (hasInvalidAttribute) {
        setIdentityError("Valor invalido em bonus de atributos.")
        return
      }

      const parsedSkills = skillTemplates.reduce<Record<string, number>>((acc, item) => {
        acc[item.key] = Math.floor(Number(draft.skillBonuses[item.key] ?? 0))
        return acc
      }, {})
      const hasInvalidSkill = Object.values(parsedSkills).some((value) => !Number.isFinite(value))
      if (hasInvalidSkill) {
        setIdentityError("Valor invalido em bonus de pericias.")
        return
      }

      payload.push({
        label,
        attributeBonuses: parsedAttributes,
        skillBonuses: parsedSkills,
      })
    }

    const endpoint = type === "race" ? "races" : "classes"
    const body = type === "race" ? { races: payload } : { classes: payload }

    try {
      const response = await fetch(`/api/rpg/${rpgId}/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        setIdentityError(result.message ?? "Nao foi possivel salvar.")
        return false
      }
      setIdentitySuccess(`${type === "race" ? "Racas" : "Classes"} salvas com sucesso.`)
      return true
    } catch {
      setIdentityError("Erro de conexao ao salvar.")
      return false
    }
  }

  async function reloadIdentityTemplates(type: "race" | "class") {
    const endpoint = type === "race" ? "races" : "classes"
    const response = await fetch(`/api/rpg/${rpgId}/${endpoint}`)
    const payload = (await response.json()) as {
      races?: IdentityTemplate[]
      classes?: IdentityTemplate[]
      message?: string
    }

    if (!response.ok) {
      throw new Error(payload.message ?? "Nao foi possivel recarregar dados.")
    }

    if (type === "race") {
      setRaceDrafts(
        (payload.races ?? []).map((item) => ({
          key: item.key,
          label: item.label,
          attributeBonuses: item.attributeBonuses ?? {},
          skillBonuses: item.skillBonuses ?? {},
        })),
      )
      return
    }

    setClassDrafts(
      (payload.classes ?? []).map((item) => ({
        key: item.key,
        label: item.label,
        attributeBonuses: item.attributeBonuses ?? {},
        skillBonuses: item.skillBonuses ?? {},
      })),
    )
  }

  function createEmptyDraft(): IdentityTemplateDraft {
    return {
      key: `draft-${crypto.randomUUID()}`,
      label: "",
      attributeBonuses: selectedAttributeKeys.reduce<Record<string, number>>((acc, key) => {
        acc[key] = 0
        return acc
      }, {}),
      skillBonuses: skillTemplates.reduce<Record<string, number>>((acc, item) => {
        acc[item.key] = 0
        return acc
      }, {}),
    }
  }

  async function handleSaveEditedDraft(
    type: "race" | "class",
    key: string,
    draft: IdentityTemplateDraft,
  ) {
    const current = type === "race" ? raceDrafts : classDrafts
    const next = current.map((item) => (item.key === key ? draft : item))
    const ok = await saveIdentityTemplates(type, next)
    if (!ok) return

    await reloadIdentityTemplates(type)
    if (type === "race") {
      setActiveRaceKey(null)
      return
    }
    setActiveClassKey(null)
  }

  async function handleSaveCreatedDraft(
    type: "race" | "class",
    draft: IdentityTemplateDraft,
  ) {
    const current = type === "race" ? raceDrafts : classDrafts
    const next = [...current, draft]
    const ok = await saveIdentityTemplates(type, next)
    if (!ok) return

    await reloadIdentityTemplates(type)
    if (type === "race") {
      setCreatingRace(false)
      return
    }
    setCreatingClass(false)
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
            <h2>Padroes do RPG</h2>
            <p>Defina atributos, status, pericias e se o RPG usa racas/classes.</p>

            <div className={styles.attributeTemplateSection}>
              <h3>Atributos</h3>
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
                  Salvar atributos
                </button>
              </div>
            </div>

            <div className={styles.attributeTemplateSection}>
              <h3>Status</h3>
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
                  Salvar status
                </button>
              </div>
            </div>

            <div className={styles.attributeTemplateSection}>
              <h3>Pericias</h3>
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
                  Adicionar pericia
                </button>
              </div>
              {skillTemplates.map((item) => (
                <div key={item.key} className={styles.actions}>
                  <span>{item.label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSkillTemplates((prev) => prev.filter((current) => current.key !== item.key))
                    }
                  >
                    Remover
                  </button>
                </div>
              ))}
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
                  Salvar pericias
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
                      onClick={() => {
                        setCreatingRace(true)
                        setActiveRaceKey(null)
                      }}
                    >
                      Criar nova raca
                    </button>
                  </div>

                  {showRaceList ? (
                    <ul className={styles.identityNameList}>
                      {raceDrafts.length === 0 ? <li>Nenhuma raca cadastrada.</li> : null}
                      {raceDrafts.map((draft) => (
                        <li key={draft.key} className={styles.identityNameListItem}>
                          <span>{draft.label.trim() || "Sem nome"}</span>
                          <div className={styles.identityItemActions}>
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={() => {
                                setActiveRaceKey(draft.key)
                                setCreatingRace(false)
                              }}
                            >
                              Avancado
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {creatingRace ? (
                    <>
                      <p>Preencha os campos da nova raca e salve para voltar.</p>
                      <IdentityTemplateForm
                        mode="create"
                        type="race"
                        initialDraft={createEmptyDraft()}
                        selectedAttributeKeys={selectedAttributeKeys}
                        skillTemplates={skillTemplates}
                        attributeLabelByKey={attributeLabelByKey}
                        onCancel={() => setCreatingRace(false)}
                        onSave={(draft) => handleSaveCreatedDraft("race", draft)}
                      />
                    </>
                  ) : null}

                  {activeRaceKey ? (
                    <>
                      <p>Editando somente a raca selecionada.</p>
                      {raceDrafts
                        .filter((draft) => draft.key === activeRaceKey)
                        .map((draft) => (
                          <IdentityTemplateForm
                            key={draft.key}
                            mode="edit"
                            type="race"
                            initialDraft={draft}
                            selectedAttributeKeys={selectedAttributeKeys}
                            skillTemplates={skillTemplates}
                            attributeLabelByKey={attributeLabelByKey}
                            onCancel={() => setActiveRaceKey(null)}
                            onSave={(nextDraft) =>
                              handleSaveEditedDraft("race", draft.key, nextDraft)
                            }
                          />
                        ))}
                    </>
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
                      onClick={() => {
                        setCreatingClass(true)
                        setActiveClassKey(null)
                      }}
                    >
                      Criar nova classe
                    </button>
                  </div>

                  {showClassList ? (
                    <ul className={styles.identityNameList}>
                      {classDrafts.length === 0 ? <li>Nenhuma classe cadastrada.</li> : null}
                      {classDrafts.map((draft) => (
                        <li key={draft.key} className={styles.identityNameListItem}>
                          <span>{draft.label.trim() || "Sem nome"}</span>
                          <div className={styles.identityItemActions}>
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={() => {
                                setActiveClassKey(draft.key)
                                setCreatingClass(false)
                              }}
                            >
                              Avancado
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {creatingClass ? (
                    <>
                      <p>Preencha os campos da nova classe e salve para voltar.</p>
                      <IdentityTemplateForm
                        mode="create"
                        type="class"
                        initialDraft={createEmptyDraft()}
                        selectedAttributeKeys={selectedAttributeKeys}
                        skillTemplates={skillTemplates}
                        attributeLabelByKey={attributeLabelByKey}
                        onCancel={() => setCreatingClass(false)}
                        onSave={(draft) => handleSaveCreatedDraft("class", draft)}
                      />
                    </>
                  ) : null}

                  {activeClassKey ? (
                    <>
                      <p>Editando somente a classe selecionada.</p>
                      {classDrafts
                        .filter((draft) => draft.key === activeClassKey)
                        .map((draft) => (
                          <IdentityTemplateForm
                            key={draft.key}
                            mode="edit"
                            type="class"
                            initialDraft={draft}
                            selectedAttributeKeys={selectedAttributeKeys}
                            skillTemplates={skillTemplates}
                            attributeLabelByKey={attributeLabelByKey}
                            onCancel={() => setActiveClassKey(null)}
                            onSave={(nextDraft) =>
                              handleSaveEditedDraft("class", draft.key, nextDraft)
                            }
                          />
                        ))}
                    </>
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
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>
            <Link href="/rpg">Cancelar</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
