"use client"

import { useEffect, useMemo, useState } from "react"
import styles from "./page.module.css"
import {
  actionTypeValues,
  effectTypeValues,
  skillCategoryValues,
  skillTypeValues,
  targetStatValues,
  type ActionType,
  type EffectType,
  type SkillCategory,
  type SkillType,
  type TargetStat,
} from "@/types/skillBuilder"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import {
  abilityCategoryDefinitions,
  abilityCategoryLabelByKey,
  normalizeEnabledAbilityCategories,
} from "@/lib/rpg/abilityCategories"

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

const actionTypeLabel: Record<ActionType, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

const skillTypeLabel: Record<SkillType, string> = {
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
type RpgSettingsPayload = {
  rpg?: {
    abilityCategoriesEnabled?: boolean
    enabledAbilityCategories?: string[]
  }
  message?: string
}

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
  type: SkillType | null
  actionType: ActionType | null
  description: string | null
  currentLevel: number
  classIds: string[]
  raceIds: string[]
  levels: SkillLevel[]
}

type MetaForm = {
  name: string
  category: SkillCategory | ""
  type: SkillType | ""
  actionType: ActionType | ""
  description: string
  currentLevel: string
  classIds: string[]
  raceIds: string[]
}

type LevelForm = {
  levelName: string
  levelDescription: string
  notesList: string[]
  levelRequired: string
  summary: string
  damage: string
  cooldown: string
  range: string
  duration: string
  castTime: string
  resourceCost: string
  costPoints: string
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

function normalizeObsList(values: string[]) {
  return values.map((item) => item.trim()).filter((item) => item.length > 0)
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
  const normalizedType = skillTypeValues.includes(skill.type as SkillType)
    ? (skill.type as SkillType)
    : ""
  const normalizedActionType = actionTypeValues.includes(skill.actionType as ActionType)
    ? (skill.actionType as ActionType)
    : ""

  return {
    name: skill.name,
    category: normalizedCategory,
    type: normalizedType,
    actionType: normalizedActionType,
    description: skill.description ?? "",
    currentLevel: String(skill.currentLevel),
    classIds: skill.classIds,
    raceIds: skill.raceIds,
  }
}

function mapLevelToForm(level: SkillLevel): LevelForm {
  const stats = level.stats ?? {}
  const cost = level.cost ?? {}
  const statsNotesListRaw = Array.isArray(stats.notesList) ? stats.notesList : []
  const statsNotesList = statsNotesListRaw
    .map((item) => (typeof item === "string" ? item : ""))
    .filter((item) => item.trim().length > 0)
  const fallbackNote = typeof stats.notes === "string" ? stats.notes : ""

  return {
    levelName: typeof stats.name === "string" ? stats.name : "",
    levelDescription: typeof stats.description === "string" ? stats.description : "",
    notesList: statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : [""],
    levelRequired: String(level.levelRequired),
    summary: level.summary ?? "",
    damage: typeof stats.damage === "string" ? stats.damage : "",
    cooldown: typeof stats.cooldown === "string" ? stats.cooldown : "",
    range: typeof stats.range === "string" ? stats.range : "",
    duration: typeof stats.duration === "string" ? stats.duration : "",
    castTime: typeof stats.castTime === "string" ? stats.castTime : "",
    resourceCost: typeof stats.resourceCost === "string" ? stats.resourceCost : "",
    costPoints: typeof cost.points === "number" ? String(cost.points) : "",
    costCustom: typeof cost.custom === "string" ? cost.custom : "",
    effects: parseEffects(level.effects),
  }
}

function getLevelCostPoints(level: SkillLevel) {
  if (!level.cost || typeof level.cost !== "object" || Array.isArray(level.cost)) {
    return null
  }

  const value = (level.cost as Record<string, unknown>).points
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null
  }

  return Math.floor(value)
}

function createInitialMeta(): MetaForm {
  return {
    name: "",
    category: "",
    type: "",
    actionType: "",
    description: "",
    currentLevel: "1",
    classIds: [],
    raceIds: [],
  }
}

function createInitialLevel(): LevelForm {
  return {
    levelName: "",
    levelDescription: "",
    notesList: [""],
    levelRequired: "1",
    summary: "",
    damage: "",
    cooldown: "",
    range: "",
    duration: "",
    castTime: "",
    resourceCost: "",
    costPoints: "",
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

function resolveCategoryLabel(value: string) {
  return abilityCategoryLabelByKey[value as SkillCategory] ?? value
}

export default function SkillsDashboardClient({
  ownedRpgs,
  initialRpgId,
  hideRpgSelector = false,
  title = "Construtor de Habilidades",
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
  const [abilityCategoriesEnabled, setAbilityCategoriesEnabled] = useState(false)
  const [enabledAbilityCategories, setEnabledAbilityCategories] = useState<SkillCategory[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [editStep, setEditStep] = useState(1)
  const [editReloadKey, setEditReloadKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedLevel = useMemo(
    () => activeSkill?.levels.find((level) => level.id === selectedLevelId) ?? null,
    [activeSkill, selectedLevelId],
  )
  const createCategoryOptions = useMemo(
    () =>
      abilityCategoryDefinitions.filter(
        (option) =>
          !abilityCategoriesEnabled ||
          enabledAbilityCategories.includes(option.key as SkillCategory),
      ),
    [abilityCategoriesEnabled, enabledAbilityCategories],
  )
  const editCategoryOptions = useMemo(() => {
    if (!metaForm.category) return createCategoryOptions
    if (createCategoryOptions.some((option) => option.key === metaForm.category)) {
      return createCategoryOptions
    }

    return [
      ...createCategoryOptions,
      {
        key: metaForm.category,
        label: `${resolveCategoryLabel(metaForm.category)} (indisponivel)`,
        description: "",
      },
    ]
  }, [createCategoryOptions, metaForm.category])

  useEffect(() => {
    if (!selectedRpgId) return

    async function loadData() {
      setLoading(true)
      setError("")
      try {
        const [classRes, raceRes, skillRes, rpgRes] = await Promise.all([
          fetch(`/api/rpg/${selectedRpgId}/classes`),
          fetch(`/api/rpg/${selectedRpgId}/races`),
          fetch(`/api/skills?rpgId=${selectedRpgId}`),
          fetch(`/api/rpg/${selectedRpgId}`),
        ])

        const classPayload = (await classRes.json()) as { classes?: TemplateOption[]; message?: string }
        const racePayload = (await raceRes.json()) as { races?: TemplateOption[]; message?: string }
        const skillPayload = (await skillRes.json()) as { skills?: SkillListItem[]; message?: string }
        const rpgPayload = (await rpgRes.json()) as RpgSettingsPayload

        if (!classRes.ok) throw new Error(classPayload.message ?? "Erro ao buscar classes.")
        if (!raceRes.ok) throw new Error(racePayload.message ?? "Erro ao buscar racas.")
        if (!skillRes.ok) throw new Error(skillPayload.message ?? "Erro ao buscar skills.")
        if (!rpgRes.ok) throw new Error(rpgPayload.message ?? "Erro ao buscar configuracoes do RPG.")

        setClasses(classPayload.classes ?? [])
        setRaces(racePayload.races ?? [])
        setSkills(skillPayload.skills ?? [])
        setAbilityCategoriesEnabled(Boolean(rpgPayload.rpg?.abilityCategoriesEnabled ?? false))
        setEnabledAbilityCategories(
          normalizeEnabledAbilityCategories(rpgPayload.rpg?.enabledAbilityCategories),
        )
        setSelectedSkillId(skillPayload.skills?.[0]?.id ?? "")
        setEditOpen(false)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro ao carregar dashboard.")
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [selectedRpgId])

  useEffect(() => {
    if (createOpen) return

    if (!selectedSkillId) {
      setActiveSkill(null)
      setSelectedLevelId("")
      setMetaForm(createInitialMeta())
      setLevelForm(createInitialLevel())
      return
    }

    let cancelled = false

    async function loadSkill() {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/skills/${selectedSkillId}`)
        const payload = (await response.json()) as { skill?: SkillDetail; message?: string }
        if (!response.ok || !payload.skill) {
          throw new Error(payload.message ?? "Erro ao carregar skill.")
        }

        if (cancelled) return
        setActiveSkill(payload.skill)
        setMetaForm(mapSkillToMetaForm(payload.skill))
        const firstLevel = payload.skill.levels[0]
        setSelectedLevelId(firstLevel?.id ?? "")
        setLevelForm(firstLevel ? mapLevelToForm(firstLevel) : createInitialLevel())
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : "Erro ao carregar skill.")
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }

    void loadSkill()
    return () => {
      cancelled = true
    }
  }, [selectedSkillId, editReloadKey, createOpen])

  useEffect(() => {
    if (createOpen) return
    if (!selectedLevel) return
    setLevelForm(mapLevelToForm(selectedLevel))
  }, [selectedLevel, createOpen])

  useEffect(() => {
    if (!abilityCategoriesEnabled) {
      setMetaForm((prev) => (prev.category ? { ...prev, category: "" } : prev))
      return
    }

    if (
      createOpen &&
      metaForm.category &&
      !enabledAbilityCategories.includes(metaForm.category)
    ) {
      setMetaForm((prev) => ({ ...prev, category: "" }))
    }
  }, [abilityCategoriesEnabled, createOpen, enabledAbilityCategories, metaForm.category])

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
                <NativeSelectField
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
                </NativeSelectField>
              </label>
              <label className={styles.field}>
                <span>Atributo alvo</span>
                <NativeSelectField
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
                </NativeSelectField>
              </label>
              <label className={styles.field}>
                <span>Modo do valor</span>
                <NativeSelectField
                  value={effect.valueMode}
                  onChange={(event) =>
                    onChange(updateEffect(effects, index, { valueMode: event.target.value as "flat" | "dice" }))
                  }
                >
                  <option value="flat">Fixo</option>
                  <option value="dice">Dado</option>
                </NativeSelectField>
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
                <span>Duracao</span>
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
                <span>Chance</span>
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
      if (abilityCategoriesEnabled && enabledAbilityCategories.length === 0) {
        throw new Error("Ative pelo menos uma categoria")
      }
      if (abilityCategoriesEnabled && !metaForm.category) {
        throw new Error("Categoria obrigatoria para criar habilidade.")
      }

      const payload = {
        rpgId: selectedRpgId,
        ...metaForm,
        currentLevel: toOptionalNumber(metaForm.currentLevel) ?? 1,
        level1: {
          levelRequired: toOptionalNumber(levelForm.levelRequired) ?? 1,
          summary: toOptionalText(levelForm.summary),
          stats: {
            name: toOptionalText(levelForm.levelName),
            description: toOptionalText(levelForm.levelDescription),
            notes: toOptionalText(levelForm.notesList[0] ?? ""),
            notesList: normalizeObsList(levelForm.notesList),
            damage: toOptionalText(levelForm.damage),
            cooldown: toOptionalText(levelForm.cooldown),
            range: toOptionalText(levelForm.range),
            duration: toOptionalText(levelForm.duration),
            castTime: toOptionalText(levelForm.castTime),
            resourceCost: toOptionalText(levelForm.resourceCost),
          },
          cost: {
            points: toOptionalNumber(levelForm.costPoints),
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
      setEditStep(1)
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

  async function saveMeta(options?: { manageSaving?: boolean; showSuccess?: boolean }) {
    if (!activeSkill) return null
    const manageSaving = options?.manageSaving ?? true
    const showSuccess = options?.showSuccess ?? true
    if (manageSaving) {
      setSaving(true)
      setError("")
      setSuccess("")
    }
    try {
      if (abilityCategoriesEnabled && enabledAbilityCategories.length === 0) {
        throw new Error("Ative pelo menos uma categoria")
      }
      if (abilityCategoriesEnabled && !metaForm.category) {
        throw new Error("Categoria obrigatoria para salvar habilidade.")
      }

      const response = await fetch(`/api/skills/${activeSkill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: metaForm.name,
          category: metaForm.category,
          type: metaForm.type,
          actionType: metaForm.actionType,
          description: metaForm.description,
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
      if (showSuccess) setSuccess("Meta da skill atualizada.")
      return result.skill
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar skill.")
      return null
    } finally {
      if (manageSaving) setSaving(false)
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
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao criar level.")
      setActiveSkill(result.skill)
      setMetaForm(mapSkillToMetaForm(result.skill))
      setSkills((prev) =>
        prev.map((item) =>
          item.id === result.skill?.id
            ? {
                ...item,
                currentLevel: result.skill.currentLevel,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      const newestLevel = result.skill.levels[result.skill.levels.length - 1]
      setSelectedLevelId(newestLevel?.id ?? "")
      setSuccess("Novo level criado com copia profunda do level anterior.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar novo level.")
    } finally {
      setSaving(false)
    }
  }

  async function saveLevel(options?: { manageSaving?: boolean; showSuccess?: boolean }) {
    if (!activeSkill || !selectedLevel) return null
    const manageSaving = options?.manageSaving ?? true
    const showSuccess = options?.showSuccess ?? true
    if (manageSaving) {
      setSaving(true)
      setError("")
      setSuccess("")
    }
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}/levels/${selectedLevel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelRequired: toOptionalNumber(levelForm.levelRequired) ?? selectedLevel.levelRequired,
          summary: toOptionalText(levelForm.summary),
          stats: {
            name: toOptionalText(levelForm.levelName),
            description: toOptionalText(levelForm.levelDescription),
            notes: toOptionalText(levelForm.notesList[0] ?? ""),
            notesList: normalizeObsList(levelForm.notesList),
            damage: toOptionalText(levelForm.damage),
            cooldown: toOptionalText(levelForm.cooldown),
            range: toOptionalText(levelForm.range),
            duration: toOptionalText(levelForm.duration),
            castTime: toOptionalText(levelForm.castTime),
            resourceCost: toOptionalText(levelForm.resourceCost),
          },
          cost: {
            points: toOptionalNumber(levelForm.costPoints),
            custom: toOptionalText(levelForm.costCustom),
          },
          effects: levelForm.effects.map((effect) => buildEffectPayload(effect)),
        }),
      })

      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao salvar level.")
      setActiveSkill(result.skill)
      if (showSuccess) setSuccess(`Level ${selectedLevel.levelNumber} atualizado.`)
      return result.skill
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar level.")
      return null
    } finally {
      if (manageSaving) setSaving(false)
    }
  }

  async function saveAll() {
    if (!activeSkill || !selectedLevel) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const savedMeta = await saveMeta({ manageSaving: false, showSuccess: false })
      if (!savedMeta) return

      const savedLevel = await saveLevel({ manageSaving: false, showSuccess: false })
      if (!savedLevel) return

      setSuccess("Habilidade atualizada.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteSelectedLevel() {
    if (!activeSkill || !selectedLevel) return
    if (activeSkill.levels.length <= 1) {
      setError("Nao e possivel remover o ultimo level da habilidade.")
      return
    }

    const shouldDelete = window.confirm(
      `Deseja deletar o level ${selectedLevel.levelNumber}? Essa acao nao pode ser desfeita.`,
    )
    if (!shouldDelete) return

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const levelNumber = selectedLevel.levelNumber
      const response = await fetch(`/api/skills/${activeSkill.id}/levels/${selectedLevel.id}`, {
        method: "DELETE",
      })

      const result = (await response.json()) as { skill?: SkillDetail; message?: string }
      if (!response.ok || !result.skill) throw new Error(result.message ?? "Erro ao remover level.")

      setActiveSkill(result.skill)
      setMetaForm(mapSkillToMetaForm(result.skill))
      setSkills((prev) =>
        prev.map((item) =>
          item.id === result.skill?.id
            ? {
                ...item,
                currentLevel: result.skill.currentLevel,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )

      const fallbackLevel =
        result.skill.levels.find((item) => item.levelNumber === levelNumber) ??
        result.skill.levels[result.skill.levels.length - 1]
      setSelectedLevelId(fallbackLevel?.id ?? "")
      setSuccess(`Level ${levelNumber} removido.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover level.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteActiveSkill() {
    if (!activeSkill) return

    const shouldDelete = window.confirm(
      `Deseja deletar a habilidade "${activeSkill.name}"? Essa acao nao pode ser desfeita.`,
    )
    if (!shouldDelete) return

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/skills/${activeSkill.id}`, {
        method: "DELETE",
      })
      const result = (await response.json()) as { id?: string; message?: string }
      if (!response.ok || !result.id) throw new Error(result.message ?? "Erro ao remover skill.")

      const nextSkills = skills.filter((item) => item.id !== activeSkill.id)
      setSkills(nextSkills)
      setSelectedSkillId(nextSkills[0]?.id ?? "")
      setEditOpen(nextSkills.length > 0)
      setSuccess("Habilidade removida com sucesso.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover skill.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1>{title}</h1>
        </div>
        <div className={styles.heroActions}>
          {!hideRpgSelector ? (
            <label className={styles.field}>
              <span>RPG ativo</span>
              <NativeSelectField value={selectedRpgId} onChange={(event) => setSelectedRpgId(event.target.value)}>
                {ownedRpgs.map((rpg) => (
                  <option key={rpg.id} value={rpg.id}>
                    {rpg.title}
                  </option>
                ))}
              </NativeSelectField>
            </label>
          ) : null}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setCreateOpen(true)
              setEditOpen(false)
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
            <div
              key={skill.id}
              className={selectedSkillId === skill.id ? styles.skillCardActive : styles.skillCard}
            >
              <strong>{skill.name}</strong>
              <small>lvl atual: {skill.currentLevel}</small>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => {
                    setCreateOpen(false)
                    setEditOpen(true)
                    setEditStep(1)
                    setSelectedSkillId(skill.id)
                    setEditReloadKey((prev) => prev + 1)
                  }}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </aside>

        <div className={styles.editor}>
          {loading ? <p className={styles.muted}>Carregando...</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {success ? <p className={styles.success}>{success}</p> : null}

          {createOpen ? (
            <section className={styles.card}>
              <h2>Criar</h2>
              <div className={styles.stepper}>
                {[1, 2, 3, 4].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={createStep === step ? styles.stepActive : styles.step}
                    onClick={() => setCreateStep(step)}
                  >
                    {step === 1 ? "Basico" : step === 2 ? "Vinculos" : step === 3 ? "Avançado" : "Efeitos"}
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
                  {abilityCategoriesEnabled ? (
                    <label className={styles.field}>
                      <span>Categoria</span>
                      <NativeSelectField
                        value={metaForm.category}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            category: event.target.value as SkillCategory | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {createCategoryOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                  ) : null}
                  <label className={styles.field}>
                    <span>Tipo</span>
                    <NativeSelectField
                      value={metaForm.type}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          type: event.target.value as SkillType | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {skillTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {skillTypeLabel[option]}
                        </option>
                      ))}
                    </NativeSelectField>
                  </label>
                  <label className={styles.field}>
                    <span>ActionType (Tipo da acao)</span>
                    <NativeSelectField
                      value={metaForm.actionType}
                      onChange={(event) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          actionType: event.target.value as ActionType | "",
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {actionTypeValues.map((option) => (
                        <option key={option} value={option}>
                          {actionTypeLabel[option]}
                        </option>
                      ))}
                    </NativeSelectField>
                  </label>
                  <label className={styles.field}>
                    <span>Level atual</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={1}
                      value={metaForm.currentLevel}
                      onChange={(event) =>
                        setMetaForm((prev) => ({ ...prev, currentLevel: event.target.value }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Level requerido</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={1}
                      value={levelForm.levelRequired}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, levelRequired: event.target.value }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Pontos necessarios para comprar</span>
                    <input
                      type="number"
                      onWheel={(event) => event.currentTarget.blur()}
                      min={0}
                      step={1}
                      value={levelForm.costPoints}
                      onChange={(event) =>
                        setLevelForm((prev) => ({ ...prev, costPoints: event.target.value }))
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
                  {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
                    <p className={styles.error}>Ative pelo menos uma categoria</p>
                  ) : null}
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
                      <span>Nome do level</span>
                      <input
                        value={levelForm.levelName}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, levelName: event.target.value }))}
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Resumo do level</span>
                      <textarea
                        rows={2}
                        value={levelForm.summary}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, summary: event.target.value }))}
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Descricao do level</span>
                      <textarea
                        rows={2}
                        value={levelForm.levelDescription}
                        onChange={(event) =>
                          setLevelForm((prev) => ({ ...prev, levelDescription: event.target.value }))
                        }
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Obs</span>
                      <div className={styles.levelBlock}>
                        {levelForm.notesList.map((item, index) => (
                          <div key={`create-obs-${index}`} className={styles.actions}>
                            <textarea
                              rows={2}
                              value={item}
                              onChange={(event) =>
                                setLevelForm((prev) => ({
                                  ...prev,
                                  notesList: prev.notesList.map((obs, obsIndex) =>
                                    obsIndex === index ? event.target.value : obs,
                                  ),
                                }))
                              }
                            />
                            <button
                              type="button"
                              className={styles.ghostButton}
                              onClick={() =>
                                setLevelForm((prev) => ({
                                  ...prev,
                                  notesList:
                                    prev.notesList.length <= 1
                                      ? [""]
                                      : prev.notesList.filter((_, obsIndex) => obsIndex !== index),
                                }))
                              }
                            >
                              Remover obs
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() =>
                            setLevelForm((prev) => ({ ...prev, notesList: [...prev.notesList, ""] }))
                          }
                        >
                          Adicionar obs
                        </button>
                      </div>
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
                  </div>
                </div>
              ) : null}

              {createStep === 4 ? (
                <div className={styles.levelBlock}>
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
                {createStep < 4 ? (
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

          {!createOpen && editOpen && activeSkill ? (
            <section className={styles.card}>
              <div className={styles.levelHeader}>
                <h2>Editar</h2>
                <div className={styles.levelHeaderActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={createSnapshotLevel}
                    disabled={saving}
                  >
                    Criar novo level
                  </button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={deleteActiveSkill}
                    disabled={saving}
                  >
                    Deletar habilidade
                  </button>
                </div>
              </div>
              <p className={styles.muted}>{activeSkill.name}</p>
              <div className={styles.stepper}>
                {[1, 2, 3].map((step) => (
                  <button
                    type="button"
                    key={step}
                    className={editStep === step ? styles.stepActive : styles.step}
                    onClick={() => setEditStep(step)}
                  >
                    {step === 1 ? "Basico" : step === 2 ? "Avançado" : "Efeitos"}
                  </button>
                ))}
              </div>

              {editStep === 1 ? (
                <>
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Nome</span>
                      <input
                        value={metaForm.name}
                        onChange={(event) => setMetaForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Level atual</span>
                      <input
                        type="number"
                        onWheel={(event) => event.currentTarget.blur()}
                        min={1}
                        value={metaForm.currentLevel}
                        onChange={(event) =>
                          setMetaForm((prev) => ({ ...prev, currentLevel: event.target.value }))
                        }
                      />
                    </label>
                    {abilityCategoriesEnabled ? (
                      <label className={styles.field}>
                        <span>Categoria</span>
                        <NativeSelectField
                          value={metaForm.category}
                          onChange={(event) =>
                            setMetaForm((prev) => ({
                              ...prev,
                              category: event.target.value as SkillCategory | "",
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {editCategoryOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </NativeSelectField>
                      </label>
                    ) : null}
                    <label className={styles.field}>
                      <span>Tipo</span>
                      <NativeSelectField
                        value={metaForm.type}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            type: event.target.value as SkillType | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {skillTypeValues.map((option) => (
                          <option key={option} value={option}>
                            {skillTypeLabel[option]}
                          </option>
                        ))}
                      </NativeSelectField>
                    </label>
                    <label className={styles.field}>
                      <span>ActionType (Tipo da acao)</span>
                      <NativeSelectField
                        value={metaForm.actionType}
                        onChange={(event) =>
                          setMetaForm((prev) => ({
                            ...prev,
                            actionType: event.target.value as ActionType | "",
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {actionTypeValues.map((option) => (
                          <option key={option} value={option}>
                            {actionTypeLabel[option]}
                          </option>
                        ))}
                      </NativeSelectField>
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
                    {abilityCategoriesEnabled && enabledAbilityCategories.length === 0 ? (
                      <p className={styles.error}>Ative pelo menos uma categoria</p>
                    ) : null}
                  </div>

                </>
              ) : null}

              {editStep >= 2 ? (
                <div className={styles.levelHeader}>
                  <h3>Editor de Levels</h3>
                  <div className={styles.levelHeaderActions}>
                    <NativeSelectField value={selectedLevelId} onChange={(event) => setSelectedLevelId(event.target.value)}>
                      {activeSkill.levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          Level {level.levelNumber} (req {level.levelRequired} | pontos {getLevelCostPoints(level) ?? 0})
                        </option>
                      ))}
                    </NativeSelectField>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={deleteSelectedLevel}
                      disabled={saving || activeSkill.levels.length <= 1}
                    >
                      Deletar level
                    </button>
                  </div>
                </div>
              ) : null}

              {editStep === 2 ? (
                <div className={styles.levelBlock}>
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Nome do level</span>
                      <input
                        value={levelForm.levelName}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, levelName: event.target.value }))}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Level requerido</span>
                      <input
                        type="number"
                        onWheel={(event) => event.currentTarget.blur()}
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
                      <span>Pontos necessarios para comprar</span>
                      <input
                        type="number"
                        onWheel={(event) => event.currentTarget.blur()}
                        min={0}
                        step={1}
                        value={levelForm.costPoints}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, costPoints: event.target.value }))}
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
                      <span>Resumo do level</span>
                      <textarea
                        rows={2}
                        value={levelForm.summary}
                        onChange={(event) => setLevelForm((prev) => ({ ...prev, summary: event.target.value }))}
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Descricao do level</span>
                      <textarea
                        rows={2}
                        value={levelForm.levelDescription}
                        onChange={(event) =>
                          setLevelForm((prev) => ({ ...prev, levelDescription: event.target.value }))
                        }
                      />
                    </label>
                    <label className={`${styles.field} ${styles.spanTwo}`}>
                      <span>Obs</span>
                      <div className={styles.levelBlock}>
                        {levelForm.notesList.map((item, index) => (
                          <div key={`edit-obs-${index}`} className={styles.actions}>
                            <textarea
                              rows={2}
                              value={item}
                              onChange={(event) =>
                                setLevelForm((prev) => ({
                                  ...prev,
                                  notesList: prev.notesList.map((obs, obsIndex) =>
                                    obsIndex === index ? event.target.value : obs,
                                  ),
                                }))
                              }
                            />
                            <button
                              type="button"
                              className={styles.ghostButton}
                              onClick={() =>
                                setLevelForm((prev) => ({
                                  ...prev,
                                  notesList:
                                    prev.notesList.length <= 1
                                      ? [""]
                                      : prev.notesList.filter((_, obsIndex) => obsIndex !== index),
                                }))
                              }
                            >
                              Remover obs
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() =>
                            setLevelForm((prev) => ({ ...prev, notesList: [...prev.notesList, ""] }))
                          }
                        >
                          Adicionar obs
                        </button>
                      </div>
                    </label>
                  </div>

                </div>
              ) : null}

              {editStep === 3 ? (
                <div className={styles.levelBlock}>
                  <EffectEditor
                    effects={levelForm.effects}
                    onChange={(effects) => setLevelForm((prev) => ({ ...prev, effects }))}
                  />

                </div>
              ) : null}

              <div className={styles.actions}>
                {editStep > 1 ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => setEditStep((prev) => prev - 1)}
                  >
                    Voltar etapa
                  </button>
                ) : null}
                {editStep < 3 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setEditStep((prev) => prev + 1)}
                  >
                    Proxima etapa
                  </button>
                ) : null}
                {editStep === 3 ? (
                  <button type="button" className={styles.primaryButton} onClick={saveAll} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar tudo"}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {!createOpen && !editOpen ? <p className={styles.muted}>Clique em &quot;Editar&quot; em uma habilidade.</p> : null}
        </div>
      </section>
    </main>
  )
}


