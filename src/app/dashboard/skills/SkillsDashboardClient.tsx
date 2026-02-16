"use client"

import { useEffect, useMemo, useState } from "react"
import styles from "./page.module.css"
import {
  effectTypeValues,
  skillCategoryValues,
  skillUsageTypeValues,
  targetStatValues,
  type EffectType,
  type SkillCategory,
  type SkillUsageType,
  type TargetStat,
} from "@/types/skillBuilder"

const effectTypeLabel: Record<EffectType, string> = {
  damage: "Dano",
  heal: "Cura",
  buff: "Buff",
  debuff: "Debuff",
  applyStatus: "Aplicar status",
  removeStatus: "Remover status",
  shield: "Escudo",
  createZone: "Criar zona",
  summon: "Invocar",
  move: "Mover",
}

const targetStatLabel: Record<TargetStat, string> = {
  hp: "Vida",
  armor: "Armadura",
  shield: "Escudo",
  mana: "Mana",
  sanity: "Sanidade",
  attribute: "Atributo",
}

const skillUsageTypeLabel: Record<SkillUsageType, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

const skillCategoryLabel: Record<SkillCategory, string> = {
  attack: "Ataque",
  burst: "Explosao",
  support: "Suporte",
  buff: "Buff",
  debuff: "Debuff",
  control: "Controle",
  defense: "Defesa",
  mobility: "Mobilidade",
  summon: "Invocacao",
  utility: "Utilidade",
  resource: "Recurso",
}

type OwnedRpg = { id: string; title: string }
type TemplateOption = { id: string; label: string }

type SkillListItem = {
  id: string
  name: string
  slug: string
  currentLevel: number
  updatedAt: string
}

type SkillEffect = {
  id: string
  type: EffectType
  targetStat: TargetStat | ""
  valueMode: "flat" | "dice"
  valueFlat: string
  diceCount: string
  diceSides: string
  diceBonus: string
  damageType: string
  duration: string
  tickInterval: string
  chance: string
  stacks: string
}

type SkillLevel = {
  id: string
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Record<string, unknown> | null
  cost: Record<string, unknown> | null
  effects: unknown
}

type SkillDetail = {
  id: string
  name: string
  slug: string
  category: SkillCategory | null
  type: SkillUsageType | null
  description: string | null
  currentLevel: number
  classIds: string[]
  raceIds: string[]
  levels: SkillLevel[]
}

type MetaForm = {
  name: string
  category: SkillCategory | ""
  type: SkillUsageType | ""
  description: string
  currentLevel: string
  classIds: string[]
  raceIds: string[]
}

type LevelForm = {
  levelRequired: string
  summary: string
  damage: string
  cooldown: string
  range: string
  duration: string
  castTime: string
  resourceCost: string
  costCustom: string
  effects: SkillEffect[]
}

type Props = {
  ownedRpgs: OwnedRpg[]
  initialRpgId?: string
  hideRpgSelector?: boolean
  title?: string
}

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function emptyEffect(): SkillEffect {
  return {
    id: crypto.randomUUID(),
    type: "damage",
    targetStat: "hp",
    valueMode: "flat",
    valueFlat: "",
    diceCount: "",
    diceSides: "",
    diceBonus: "",
    damageType: "",
    duration: "",
    tickInterval: "",
    chance: "",
    stacks: "",
  }
}

function parseEffects(input: unknown) {
  if (!Array.isArray(input) || input.length === 0) {
    return [emptyEffect()]
  }

  const effects = input
    .map((raw): SkillEffect | null => {
      if (!raw || typeof raw !== "object") return null
      const effect = raw as Record<string, unknown>
      const value = effect.value && typeof effect.value === "object"
        ? (effect.value as Record<string, unknown>)
        : {}
      const mode = value.mode === "dice" ? "dice" : "flat"

      return {
        id: typeof effect.id === "string" ? effect.id : crypto.randomUUID(),
        type: effectTypeValues.includes(effect.type as EffectType) ? (effect.type as EffectType) : "damage",
        targetStat: targetStatValues.includes(effect.targetStat as TargetStat)
          ? (effect.targetStat as TargetStat)
          : "",
        valueMode: mode,
        valueFlat: typeof value.flat === "number" ? String(value.flat) : "",
        diceCount: typeof value.diceCount === "number" ? String(value.diceCount) : "",
        diceSides: typeof value.diceSides === "number" ? String(value.diceSides) : "",
        diceBonus: typeof value.bonus === "number" ? String(value.bonus) : "",
        damageType: typeof effect.damageType === "string" ? effect.damageType : "",
        duration: typeof effect.duration === "string" ? effect.duration : "",
        tickInterval: typeof effect.tickInterval === "string" ? effect.tickInterval : "",
        chance: typeof effect.chance === "number" ? String(effect.chance) : "",
        stacks: typeof effect.stacks === "number" ? String(effect.stacks) : "",
      }
    })
    .filter((item): item is SkillEffect => item !== null)

  return effects.length > 0 ? effects : [emptyEffect()]
}

function buildEffectPayload(effect: SkillEffect) {
  const value =
    effect.valueMode === "dice"
      ? {
          mode: "dice",
          diceCount: toOptionalNumber(effect.diceCount),
          diceSides: toOptionalNumber(effect.diceSides),
          bonus: toOptionalNumber(effect.diceBonus),
        }
      : {
          mode: "flat",
          flat: toOptionalNumber(effect.valueFlat),
        }

  return {
    id: effect.id,
    type: effect.type,
    targetStat: effect.targetStat || null,
    value,
    damageType: toOptionalText(effect.damageType),
    duration: toOptionalText(effect.duration),
    tickInterval: toOptionalText(effect.tickInterval),
    chance: toOptionalNumber(effect.chance),
    stacks: toOptionalNumber(effect.stacks),
  }
}

function mapSkillToMetaForm(skill: SkillDetail): MetaForm {
  const normalizedCategory = skillCategoryValues.includes(skill.category as SkillCategory)
    ? (skill.category as SkillCategory)
    : ""
  const normalizedType = skillUsageTypeValues.includes(skill.type as SkillUsageType)
    ? (skill.type as SkillUsageType)
    : ""

  return {
    name: skill.name,
    category: normalizedCategory,
    type: normalizedType,
    description: skill.description ?? "",
    currentLevel: String(skill.currentLevel),
    classIds: skill.classIds,
    raceIds: skill.raceIds,
  }
}

function mapLevelToForm(level: SkillLevel): LevelForm {
  const stats = level.stats ?? {}
  const cost = level.cost ?? {}

  return {
    levelRequired: String(level.levelRequired),
    summary: level.summary ?? "",
    damage: typeof stats.damage === "string" ? stats.damage : "",
    cooldown: typeof stats.cooldown === "string" ? stats.cooldown : "",
    range: typeof stats.range === "string" ? stats.range : "",
    duration: typeof stats.duration === "string" ? stats.duration : "",
    castTime: typeof stats.castTime === "string" ? stats.castTime : "",
    resourceCost: typeof stats.resourceCost === "string" ? stats.resourceCost : "",
    costCustom: typeof cost.custom === "string" ? cost.custom : "",
    effects: parseEffects(level.effects),
  }
}

function createInitialMeta(): MetaForm {
  return {
    name: "",
    category: "",
    type: "",
    description: "",
    currentLevel: "1",
    classIds: [],
    raceIds: [],
  }
}

function createInitialLevel(): LevelForm {
  return {
    levelRequired: "1",
    summary: "",
    damage: "",
    cooldown: "",
    range: "",
    duration: "",
    castTime: "",
    resourceCost: "",
    costCustom: "",
    effects: [emptyEffect()],
  }
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

function updateEffect(list: SkillEffect[], index: number, patch: Partial<SkillEffect>) {
  return list.map((effect, current) => (current === index ? { ...effect, ...patch } : effect))
}

function moveEffect(list: SkillEffect[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [removed] = next.splice(from, 1)
  next.splice(to, 0, removed)
  return next
}

export default function SkillsDashboardClient({
  ownedRpgs,
  initialRpgId,
  hideRpgSelector = false,
  title = "Skill Builder",
}: Props) {
  const initialSelection =
    initialRpgId && ownedRpgs.some((item) => item.id === initialRpgId)
      ? initialRpgId
      : (ownedRpgs[0]?.id ?? "")
  const [selectedRpgId, setSelectedRpgId] = useState(initialSelection)
  const [classes, setClasses] = useState<TemplateOption[]>([])
  const [races, setRaces] = useState<TemplateOption[]>([])
  const [skills, setSkills] = useState<SkillListItem[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [activeSkill, setActiveSkill] = useState<SkillDetail | null>(null)
  const [selectedLevelId, setSelectedLevelId] = useState("")
  const [metaForm, setMetaForm] = useState<MetaForm>(createInitialMeta())
  const [levelForm, setLevelForm] = useState<LevelForm>(createInitialLevel())
  const [createOpen, setCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedLevel = useMemo(
    () => activeSkill?.levels.find((level) => level.id === selectedLevelId) ?? null,
    [activeSkill, selectedLevelId],
  )

  useEffect(() => {
    if (!selectedRpgId) return

    async function loadData() {
      setLoading(true)
      setError("")
      try {
        const [classRes, raceRes, skillRes] = await Promise.all([
          fetch(`/api/rpg/${selectedRpgId}/classes`),
          fetch(`/api/rpg/${selectedRpgId}/races`),
          fetch(`/api/skills?rpgId=${selectedRpgId}`),
        ])

        const classPayload = (await classRes.json()) as { classes?: TemplateOption[]; message?: string }
        const racePayload = (await raceRes.json()) as { races?: TemplateOption[]; message?: string }
        const skillPayload = (await skillRes.json()) as { skills?: SkillListItem[]; message?: string }

        if (!classRes.ok) throw new Error(classPayload.message ?? "Erro ao buscar classes.")
        if (!raceRes.ok) throw new Error(racePayload.message ?? "Erro ao buscar racas.")
        if (!skillRes.ok) throw new Error(skillPayload.message ?? "Erro ao buscar skills.")

        setClasses(classPayload.classes ?? [])
        setRaces(racePayload.races ?? [])
        setSkills(skillPayload.skills ?? [])
        setSelectedSkillId(skillPayload.skills?.[0]?.id ?? "")
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro ao carregar dashboard.")
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [selectedRpgId])

  useEffect(() => {
    if (!selectedSkillId) {
      setActiveSkill(null)
      setSelectedLevelId("")
      return
    }

    async function loadSkill() {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/skills/${selectedSkillId}`)
        const payload = (await response.json()) as { skill?: SkillDetail; message?: string }
        if (!response.ok || !payload.skill) {
          throw new Error(payload.message ?? "Erro ao carregar skill.")
        }

        setActiveSkill(payload.skill)
        setMetaForm(mapSkillToMetaForm(payload.skill))
        const firstLevel = payload.skill.levels[0]
        setSelectedLevelId(firstLevel?.id ?? "")
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro ao carregar skill.")
      } finally {
        setLoading(false)
      }
    }

    void loadSkill()
  }, [selectedSkillId])

  useEffect(() => {
    if (!selectedLevel) return
    setLevelForm(mapLevelToForm(selectedLevel))
  }, [selectedLevel])

  function EffectEditor({
    effects,
    onChange,
  }: {
    effects: SkillEffect[]
    onChange: (next: SkillEffect[]) => void
  }) {
    return (
      <div className={styles.effects}>
        <h3>Efeitos</h3>
        {effects.map((effect, index) => (
          <article key={effect.id} className={styles.effectCard}>
            <div className={styles.effectTop}>
              <strong>Efeito {index + 1}</strong>
              <div className={styles.effectActions}>
                <button type="button" onClick={() => onChange(moveEffect(effects, index, index - 1))}>
                  Subir
                </button>
                <button type="button" onClick={() => onChange(moveEffect(effects, index, index + 1))}>
                  Descer
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(effects.length === 1 ? [emptyEffect()] : effects.filter((_, i) => i !== index))
                  }
                >
                  Remover
                </button>
              </div>
            </div>

            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Tipo</span>
                <select
                  value={effect.type}
                  onChange={(event) =>
                    onChange(updateEffect(effects, index, { type: event.target.value as EffectType }))
                  }
                >
                  {effectTypeValues.map((option) => (
                    <option key={option} value={option}>
                      {effectTypeLabel[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Atributo alvo</span>
                <select
                  value={effect.targetStat}
                  onChange={(event) =>
                    onChange(updateEffect(effects, index, { targetStat: event.target.value as TargetStat | "" }))
                  }
                >
                  <option value="">Nenhum</option>
                  {targetStatValues.map((option) => (
                    <option key={option} value={option}>
                      {targetStatLabel[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Modo do valor</span>
                <select
                  value={effect.valueMode}
                  onChange={(event) =>
                    onChange(updateEffect(effects, index, { valueMode: event.target.value as "flat" | "dice" }))
                  }
                >
                  <option value="flat">Fixo</option>
                  <option value="dice">Dado</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Valor fixo</span>
                <input
                  value={effect.valueFlat}
                  onChange={(event) => onChange(updateEffect(effects, index, { valueFlat: event.target.value }))}
                  disabled={effect.valueMode !== "flat"}
                />
              </label>
              <label className={styles.field}>
                <span>Qtd. de dados</span>
                <input
                  value={effect.diceCount}
                  onChange={(event) => onChange(updateEffect(effects, index, { diceCount: event.target.value }))}
                  disabled={effect.valueMode !== "dice"}
                />
              </label>
              <label className={styles.field}>
                <span>Lados do dado</span>
                <input
                  value={effect.diceSides}
                  onChange={(event) => onChange(updateEffect(effects, index, { diceSides: event.target.value }))}
                  disabled={effect.valueMode !== "dice"}
                />
              </label>
              <label className={styles.field}>
                <span>Bonus do dado</span>
                <input
                  value={effect.diceBonus}
                  onChange={(event) => onChange(updateEffect(effects, index, { diceBonus: event.target.value }))}
                  disabled={effect.valueMode !== "dice"}
                />
              </label>
              <label className={styles.field}>
                <span>Tipo de dano</span>
                <input
                  value={effect.damageType}
                  onChange={(event) => onChange(updateEffect(effects, index, { damageType: event.target.value }))}
                />
              </label>
              <label className={styles.field}>
                <span>duration</span>
                <input
                  value={effect.duration}
                  onChange={(event) => onChange(updateEffect(effects, index, { duration: event.target.value }))}
                />
              </label>
              <label className={styles.field}>
                <span>Intervalo de tick</span>
                <input
                  value={effect.tickInterval}
                  onChange={(event) => onChange(updateEffect(effects, index, { tickInterval: event.target.value }))}
                />
              </label>
              <label className={styles.field}>
                <span>chance</span>
                <input
                  value={effect.chance}
                  onChange={(event) => onChange(updateEffect(effects, index, { chance: event.target.value }))}
                />
              </label>
              <label className={styles.field}>
                <span>Acumulos</span>
                <input
                  value={effect.stacks}
                  onChange={(event) => onChange(updateEffect(effects, index, { stacks: event.target.value }))}
                />
              </label>
            </div>
          </article>
        ))}
        <button type="button" className={styles.ghostButton} onClick={() => onChange([...effects, emptyEffect()])}>
          Adicionar efeito
        </button>
      </div>
    )
  }

  async function createSkill() {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const payload = {
        rpgId: selectedRpgId,
        ...metaForm,
        currentLevel: toOptionalNumber(metaForm.currentLevel) ?? 1,
        level1: {
          levelRequired: toOptionalNumber(levelForm.levelRequired) ?? 1,
          summary: toOptionalText(levelForm.summary),
          stats: {
            damage: toOptionalText(levelForm.damage),
            cooldown: toOptionalText(levelForm.cooldown),
            range: toOptionalText(levelForm.range),
            duration: toOptionalText(levelForm.duration),
            castTime: toOptionalText(levelForm.castTime),
            resourceCost: toOptionalText(levelForm.resourceCost),
          },
          cost: {
            custom: toOptionalText(levelForm.costCustom),
          },
          effects: levelForm.effects.map((effect) => buildEffectPayload(effect)),
        },
      }

      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) {
        throw new Error(result.message ?? "Erro ao criar habilidade.")
      }
      const createdSkill = result.skill

      setCreateOpen(false)
      setSelectedSkillId(createdSkill.id)
      setSkills((prev) => [
        {
          id: createdSkill.id,
          name: createdSkill.name,
          slug: createdSkill.slug,
          currentLevel: createdSkill.currentLevel,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setSuccess("Habilidade criada com sucesso.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar skill.")
    } finally {
      setSaving(false)
    }
  }

  async function saveMeta() {
    if (!activeSkill) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...metaForm,
          currentLevel: toOptionalNumber(metaForm.currentLevel) ?? 1,
        }),
      })

      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) {
        throw new Error(result.message ?? "Erro ao salvar meta.")
      }

      setActiveSkill(result.skill)
      setSkills((prev) =>
        prev.map((item) =>
          item.id === result.skill?.id
            ? {
                ...item,
                name: result.skill.name,
                slug: result.skill.slug,
                currentLevel: result.skill.currentLevel,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      setSuccess("Meta da skill atualizada.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar skill.")
    } finally {
      setSaving(false)
    }
  }

  async function createSnapshotLevel() {
    if (!activeSkill) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}/levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao criar nivel.")
      setActiveSkill(result.skill)
      const newestLevel = result.skill.levels[result.skill.levels.length - 1]
      setSelectedLevelId(newestLevel?.id ?? "")
      setSuccess("Novo nivel criado com copia profunda do nivel anterior.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar novo nivel.")
    } finally {
      setSaving(false)
    }
  }

  async function saveLevel() {
    if (!activeSkill || !selectedLevel) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}/levels/${selectedLevel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelRequired: toOptionalNumber(levelForm.levelRequired) ?? selectedLevel.levelRequired,
          summary: toOptionalText(levelForm.summary),
          stats: {
            damage: toOptionalText(levelForm.damage),
            cooldown: toOptionalText(levelForm.cooldown),
            range: toOptionalText(levelForm.range),
            duration: toOptionalText(levelForm.duration),
            castTime: toOptionalText(levelForm.castTime),
            resourceCost: toOptionalText(levelForm.resourceCost),
          },
          cost: {
            custom: toOptionalText(levelForm.costCustom),
          },
          effects: levelForm.effects.map((effect) => buildEffectPayload(effect)),
        }),
      })

      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao salvar nivel.")
      setActiveSkill(result.skill)
      setSuccess(`Nivel ${selectedLevel.levelNumber} atualizado.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar nivel.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Dashboard</p>
          <h1>{title}</h1>
          <p>CRUD completo com niveis imutaveis e effects[] flexiveis.</p>
        </div>
        <div className={styles.heroActions}>
          {!hideRpgSelector ? (
            <label className={styles.field}>
              <span>RPG ativo</span>
              <select value={selectedRpgId} onChange={(event) => setSelectedRpgId(event.target.value)}>
                {ownedRpgs.map((rpg) => (
                  <option key={rpg.id} value={rpg.id}>
                    {rpg.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setCreateOpen(true)
              setCreateStep(1)
              setMetaForm(createInitialMeta())
              setLevelForm(createInitialLevel())
            }}
          >
            Criar habilidade
          </button>
        </div>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.sidebar}>
          <h2>Habilidades</h2>
          {skills.map((skill) => (
            <button
              type="button"
              key={skill.id}
              className={selectedSkillId === skill.id ? styles.skillCardActive : styles.skillCard}
              onClick={() => {
                setCreateOpen(false)
                setSelectedSkillId(skill.id)
              }}
            >
              <strong>{skill.name}</strong>
              <small>lvl atual: {skill.currentLevel}</small>
            </button>
          ))}
        </aside>

        <div className={styles.editor}>
          {loading ? <p className={styles.muted}>Carregando...</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.success}>{success}</p> : null}

          {createOpen ? (
            <section className={styles.card}>
              <div className={styles.stepper}>
                {[1, 2, 3].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={createStep === step ? styles.stepActive : styles.step}
                    onClick={() => setCreateStep(step)}
                  >
                    {step === 1 ? "Basico" : step === 2 ? "Vinculos" : "Level 1"}
                  </button>
                ))}
              </div>

              {createStep === 1 ? (
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>Nome</span>
                    <input
                      value={metaForm.name}
                      onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Categoria</span>
                    <select
                      value={metaForm.category}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          category: event.target.value as SkillCategory | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {skillCategoryValues.map((option) => (
                        <option key={option} value={option}>
                          {skillCategoryLabel[option]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Tipo</span>
                    <select
                      value={metaForm.type}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          type: event.target.value as SkillUsageType | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {skillUsageTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {skillUsageTypeLabel[option]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Nivel atual</span>
                    <input
                      type="number"
                      min={1}
                      value={metaForm.currentLevel}
                      onChange={(event) =>
                        setMetaForm((prev) => ({ ...prev, currentLevel: event.target.value }))
                      }
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Descricao</span>
                    <textarea
                      rows={3}
                      value={metaForm.description}
                      onChange={(event) =>
                        setMetaForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              {createStep === 2 ? (
                <div className={styles.bindingGrid}>
                  <div className={styles.bindBox}>
                    <h3>Classes (0..N)</h3>
                    {classes.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.classIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              classIds: toggleId(prev.classIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.bindBox}>
                    <h3>Racas (0..N)</h3>
                    {races.map((item) => (
                      <label key={item.id} className={styles.check}>
                        <input
                          type="checkbox"
                          checked={metaForm.raceIds.includes(item.id)}
                          onChange={() =>
                            setMetaForm((prev) => ({
                              ...prev,
                              raceIds: toggleId(prev.raceIds, item.id),
                            }))
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {createStep === 3 ? (
                <div className={styles.levelBlock}>
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Nivel requerido</span>
                      <input
                        type="number"
                        min={1}
                        value={levelForm.levelRequired}
                        onChange={(event) =>
                          setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Dano</span>
                      <input
                        value={levelForm.damage}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, damage: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Recarga</span>
                      <input
                        value={levelForm.cooldown}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, cooldown: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Alcance</span>
                      <input
                        value={levelForm.range}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, range: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Duracao</span>
                      <input
                        value={levelForm.duration}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, duration: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Tempo de conjuracao</span>
                      <input
                        value={levelForm.castTime}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, castTime: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Custo de recurso</span>
                      <input
                        value={levelForm.resourceCost}
                        onChange={(event) =>
                          setLevelForm((prev) => ({ ...prev, resourceCost: event.target.value }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Custo personalizado</span>
                      <input
                        value={levelForm.costCustom}
                        onChange={(event) =>
                          setLevelForm((prev) => ({ ...prev, costCustom: event.target.value }))
                        }
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Resumo do nivel</span>
                      <textarea
                        rows={2}
                        value={levelForm.summary}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, summary: event.target.value }))}
                      />
                    </label>
                  </div>
                  <EffectEditor
                    effects={levelForm.effects}
                    onChange={(effects) => setLevelForm((prev) => ({ ...prev, effects }))}
                  />
                </div>
              ) : null}

              <div className={styles.actions}>
                {createStep > 1 ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setCreateStep((prev) => prev - 1)}
                  >
                    Voltar etapa
                  </button>
                ) : null}
                {createStep < 3 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setCreateStep((prev) => prev + 1)}
                  >
                    Proxima etapa
                  </button>
                ) : (
                  <button type="button" className={styles.primaryButton} onClick={createSkill} disabled={saving}>
                    {saving ? "Criando..." : "Criar habilidade"}
                  </button>
                )}
              </div>
            </section>
          ) : null}

          {!createOpen && activeSkill ? (
            <section className={styles.card}>
              <h2>{activeSkill.name}</h2>

              <div className={styles.grid}>
                <label className={styles.field}>
                  <span>Nome</span>
                  <input
                    value={metaForm.name}
                    onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span>Nivel atual</span>
                  <input
                    type="number"
                    min={1}
                    value={metaForm.currentLevel}
                    onChange={(event) =>
                      setMetaForm((prev) => ({ ...prev, currentLevel: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Categoria</span>
                  <select
                    value={metaForm.category}
                    onChange={(event) =>
                      setMetaForm((prev) => ({
                        ...prev,
                        category: event.target.value as SkillCategory | "",
                      }))
                    }
                  >
                    <option value="">Selecione</option>
                    {skillCategoryValues.map((option) => (
                      <option key={option} value={option}>
                        {skillCategoryLabel[option]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Tipo</span>
                  <select
                    value={metaForm.type}
                    onChange={(event) =>
                      setMetaForm((prev) => ({
                        ...prev,
                        type: event.target.value as SkillUsageType | "",
                      }))
                    }
                  >
                    <option value="">Selecione</option>
                    {skillUsageTypeValues.map((option) => (
                      <option key={option} value={option}>
                        {skillUsageTypeLabel[option]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${styles.field} ${styles.spanTwo}`}>
                  <span>Descricao</span>
                  <textarea
                    rows={2}
                    value={metaForm.description}
                    onChange={(event) =>
                      setMetaForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className={styles.bindingGrid}>
                <div className={styles.bindBox}>
                  <h3>Classes</h3>
                  {classes.map((item) => (
                    <label key={item.id} className={styles.check}>
                      <input
                        type="checkbox"
                        checked={metaForm.classIds.includes(item.id)}
                        onChange={() =>
                          setMetaForm((prev) => ({
                            ...prev,
                            classIds: toggleId(prev.classIds, item.id),
                          }))
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.bindBox}>
                  <h3>Racas</h3>
                  {races.map((item) => (
                    <label key={item.id} className={styles.check}>
                      <input
                        type="checkbox"
                        checked={metaForm.raceIds.includes(item.id)}
                        onChange={() =>
                          setMetaForm((prev) => ({
                            ...prev,
                            raceIds: toggleId(prev.raceIds, item.id),
                          }))
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.primaryButton} onClick={saveMeta} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar meta"}
                </button>
              </div>

              <div className={styles.levelHeader}>
                <h3>Level Editor</h3>
                <div className={styles.levelHeaderActions}>
                  <select value={selectedLevelId} onChange={(event) => setSelectedLevelId(event.target.value)}>
                    {activeSkill.levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        Nivel {level.levelNumber} (req {level.levelRequired})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={createSnapshotLevel}
                    disabled={saving}
                  >
                    Criar novo nivel (copiar anterior)
                  </button>
                </div>
              </div>

              <div className={styles.levelBlock}>
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>Nivel requerido</span>
                    <input
                      type="number"
                      min={1}
                      value={levelForm.levelRequired}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Dano</span>
                    <input
                      value={levelForm.damage}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, damage: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Recarga</span>
                    <input
                      value={levelForm.cooldown}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, cooldown: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Alcance</span>
                    <input
                      value={levelForm.range}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, range: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Duracao</span>
                    <input
                      value={levelForm.duration}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, duration: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Tempo de conjuracao</span>
                    <input
                      value={levelForm.castTime}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, castTime: event.target.value }))}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Custo de recurso</span>
                    <input
                      value={levelForm.resourceCost}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, resourceCost: event.target.value }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Custo personalizado</span>
                    <input
                      value={levelForm.costCustom}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, costCustom: event.target.value }))}
                    />
                  </label>
                  <label className={`${styles.field} ${styles.spanTwo}`}>
                    <span>Resumo do nivel</span>
                    <textarea
                      rows={2}
                      value={levelForm.summary}
                      onChange={(event) => setLevelForm((prev) => ({ ...prev, summary: event.target.value }))}
                    />
                  </label>
                </div>

                <EffectEditor
                  effects={levelForm.effects}
                  onChange={(effects) => setLevelForm((prev) => ({ ...prev, effects }))}
                />

                <div className={styles.actions}>
                  <button type="button" className={styles.primaryButton} onClick={saveLevel} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar nivel"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}
