import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { parseCharacterAbilities, parseCostPoints } from "@/lib/server/costSystem"
import { normalizeSkillTags } from "@/lib/rpg/skillTags"
import RichTextPreview from "@/presentation/entity-catalog/RichTextPreview"
import ClassSkillsClient from "./ClassSkillsClient"
import styles from "./page.module.css"

type Props = {
  params: Promise<{
    rpgId: string
    classId: string
  }>
}

type DbClassRow = {
  id: string
  key: string
  label: string
  rpgId: string
  ownerId: string
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  catalogMeta?: Prisma.JsonValue
}

type DbSkillLevelRow = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  skillActionType: string | null
  skillTags: string[]
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Prisma.JsonValue
  cost: Prisma.JsonValue
  target: Prisma.JsonValue
  area: Prisma.JsonValue
  scaling: Prisma.JsonValue
  requirement: Prisma.JsonValue
}

type DbCharacterRow = {
  id: string
  skillPoints: number
  abilities: Prisma.JsonValue
}

type SkillLevelView = {
  levelNumber: number
  levelRequired: number
  upgradeFromLevelNumber: number | null
  levelCategory: string | null
  levelType: string | null
  levelActionType: string | null
  levelName: string | null
  levelDescription: string | null
  notes: string | null
  notesList: string[]
  customFields: Array<{ id: string; name: string; value: string | null }>
  description: string | null
  summary: string | null
  damage: string | null
  range: string | null
  cooldown: string | null
  duration: string | null
  castTime: string | null
  resourceCost: string | null
  pointsCost: number | null
  costCustom: string | null
  target: Record<string, unknown> | null
  area: Record<string, unknown> | null
  scaling: Record<string, unknown> | null
  requirement: Record<string, unknown> | null
}

type SkillView = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  skillActionType: string | null
  skillTags: string[]
  levels: SkillLevelView[]
}

function parseJsonObject(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function toOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export default async function ClassPage({ params }: Props) {
  const { rpgId, classId } = await params

  let classRows: DbClassRow[] = []
  try {
    classRows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
      SELECT
        c.id,
        c.key,
        c.label,
        c.rpg_id AS "rpgId",
        r.owner_id AS "ownerId",
          r.visibility,
          COALESCE(r.costs_enabled, false) AS "costsEnabled",
          COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName",
          c.catalog_meta AS "catalogMeta"
      FROM rpg_class_templates c
      INNER JOIN rpgs r ON r.id = c.rpg_id
      WHERE c.id = ${classId}
        AND c.rpg_id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "costs_enabled" does not exist') ||
        error.message.includes('column "cost_resource_name" does not exist') ||
        error.message.includes('column "catalog_meta" does not exist'))
    ) {
      classRows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.key,
          c.label,
          c.rpg_id AS "rpgId",
          r.owner_id AS "ownerId",
          r.visibility,
          false AS "costsEnabled",
          'Skill Points' AS "costResourceName",
          NULL::jsonb AS "catalogMeta"
        FROM rpg_class_templates c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE c.id = ${classId}
          AND c.rpg_id = ${rpgId}
        LIMIT 1
      `)
    } else {
      throw error
    }
  }

  const dbClass = classRows[0]
  if (!dbClass) {
    notFound()
  }
  const catalogMeta = normalizeEntityCatalogMeta(dbClass.catalogMeta)
  const richSections = [
    { key: "description", label: "Descricao" },
    { key: "lore", label: "Lore" },
    { key: "notes", label: "Observacoes" },
  ].filter((section) => Boolean(catalogMeta.richText[section.key as "description" | "lore" | "notes"]))

  const userId = await getUserIdFromCookieStore()
  const isOwner = userId === dbClass.ownerId
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (dbClass.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  let levelRows: DbSkillLevelRow[] = []
  try {
    levelRows = await prisma.$queryRaw<DbSkillLevelRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "skillName",
        NULL::text AS "skillDescription",
        NULL::text AS "skillCategory",
        NULL::text AS "skillType",
        NULL::text AS "skillActionType",
        COALESCE(s.tags, ARRAY[]::text[]) AS "skillTags",
        sl.level_number AS "levelNumber",
        sl.level_required AS "levelRequired",
        sl.summary,
        sl.stats,
        sl.cost,
        sl.target,
        sl.area,
        sl.scaling,
        sl.requirement
      FROM skill_class_links scl
      INNER JOIN skills s ON s.id = scl.skill_id
      INNER JOIN skill_levels sl ON sl.skill_id = s.id
      WHERE scl.class_template_id = ${classId}
      ORDER BY s.slug ASC, sl.level_number ASC
    `)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
      throw error
    }

    levelRows = await prisma.$queryRaw<DbSkillLevelRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "skillName",
        NULL::text AS "skillDescription",
        NULL::text AS "skillCategory",
        NULL::text AS "skillType",
        NULL::text AS "skillActionType",
        ARRAY[]::text[] AS "skillTags",
        sl.level_number AS "levelNumber",
        sl.level_required AS "levelRequired",
        sl.summary,
        sl.stats,
        sl.cost,
        sl.target,
        sl.area,
        sl.scaling,
        sl.requirement
      FROM skill_class_links scl
      INNER JOIN skills s ON s.id = scl.skill_id
      INNER JOIN skill_levels sl ON sl.skill_id = s.id
      WHERE scl.class_template_id = ${classId}
      ORDER BY s.slug ASC, sl.level_number ASC
    `)
  }

  let characterId: string | null = null
  let initialPoints = 0
  let initialOwnedBySkill: Record<string, number[]> = {}

  if (userId) {
    try {
      const playerRows = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
        SELECT
          id,
          skill_points AS "skillPoints",
          COALESCE(abilities, '[]'::jsonb) AS abilities
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          AND character_type = 'player'::"RpgCharacterType"
          AND (
            created_by_user_id = ${userId}
            OR ${isOwner} = true
          )
          AND (
            class_key = ${dbClass.key}
            OR class_key = ${dbClass.id}
          )
        ORDER BY
          CASE WHEN created_by_user_id = ${userId} THEN 0 ELSE 1 END ASC,
          created_at ASC
        LIMIT 1
      `)

      const player = playerRows[0]
      if (player) {
        characterId = player.id
        initialPoints = player.skillPoints
        initialOwnedBySkill = parseCharacterAbilities(player.abilities).reduce<Record<string, number[]>>(
          (acc, item) => {
            if (!acc[item.skillId]) {
              acc[item.skillId] = []
            }
            if (!acc[item.skillId].includes(item.level)) {
              acc[item.skillId].push(item.level)
            }
            return acc
          },
          {},
        )
      }
    } catch {
      characterId = null
      initialPoints = 0
      initialOwnedBySkill = {}
    }
  }

  const grouped = levelRows.reduce<Record<string, SkillView>>((acc, row) => {
    const stats = parseJsonObject(row.stats)
    const cost = parseJsonObject(row.cost)
    const requirement = parseJsonObject(row.requirement)
    const statsNotesListRaw = Array.isArray(stats.notesList) ? stats.notesList : []
    const statsNotesList = statsNotesListRaw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
    const fallbackNote = toOptionalText(stats.notes)
    const statsCustomFieldsRaw = Array.isArray(stats.customFields) ? stats.customFields : []
    const statsCustomFields = statsCustomFieldsRaw
      .map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null
        const record = item as Record<string, unknown>
        const name = typeof record.name === "string" ? record.name.trim() : ""
        if (!name) return null
        const id =
          typeof record.id === "string" && record.id.trim().length > 0
            ? record.id.trim()
            : `custom-${index}`
        return {
          id,
          name,
          value: toOptionalText(record.value),
        }
      })
      .filter((item): item is { id: string; name: string; value: string | null } => Boolean(item))
    const upgradeFromLevelNumberRaw = requirement.upgradeFromLevelNumber
    const upgradeFromLevelNumber =
      typeof upgradeFromLevelNumberRaw === "number" && Number.isFinite(upgradeFromLevelNumberRaw)
        ? Math.floor(upgradeFromLevelNumberRaw)
        : null
    const skill = acc[row.skillId] ?? {
      skillId: row.skillId,
      skillName: row.skillName,
      skillDescription: row.skillDescription?.trim() || null,
      skillCategory: row.skillCategory?.trim() || null,
      skillType: row.skillType,
      skillActionType: row.skillActionType,
      skillTags: normalizeSkillTags(row.skillTags),
      levels: [],
    }

    skill.levels.push({
      levelNumber: row.levelNumber,
      levelRequired: row.levelRequired,
      upgradeFromLevelNumber,
      levelCategory: toOptionalText(stats.category) ?? toOptionalText(row.skillCategory),
      levelType: toOptionalText(stats.type) ?? toOptionalText(row.skillType),
      levelActionType: toOptionalText(stats.actionType) ?? toOptionalText(row.skillActionType),
      levelName: toOptionalText(stats.name),
      levelDescription: toOptionalText(stats.description),
      notes: fallbackNote,
      notesList: statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : [],
      customFields: statsCustomFields,
      description: row.skillDescription?.trim() || null,
      summary: row.summary?.trim() || null,
      damage: toOptionalText(stats.damage),
      range: toOptionalText(stats.range),
      cooldown: toOptionalText(stats.cooldown),
      duration: toOptionalText(stats.duration),
      castTime: toOptionalText(stats.castTime),
      resourceCost: toOptionalText(stats.resourceCost),
      pointsCost: parseCostPoints(row.cost) ?? 0,
      costCustom: toOptionalText(cost.custom),
      target: parseJsonObject(row.target),
      area: parseJsonObject(row.area),
      scaling: parseJsonObject(row.scaling),
      requirement,
    })

    acc[row.skillId] = skill
    return acc
  }, {})

  const skills = Object.values(grouped)

  return (
    <div className={styles.container}>
      <h1 className={styles.classTitle}>{dbClass.label}</h1>

      {catalogMeta.shortDescription ? (
        <p className={styles.abilityDescription}>{catalogMeta.shortDescription}</p>
      ) : null}

      {richSections.map((section) => (
        <section key={section.key} style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ color: "var(--color-text-primary)" }}>{section.label}</h2>
          <RichTextPreview
            value={
              catalogMeta.richText[section.key as "description" | "lore" | "notes"] as Record<string, unknown>
            }
          />
        </section>
      ))}

      <ClassSkillsClient
        characterId={characterId}
        costsEnabled={dbClass.costsEnabled}
        costResourceName={dbClass.costResourceName}
        initialPoints={initialPoints}
        initialOwnedBySkill={initialOwnedBySkill}
        skills={skills}
      />

      {skills.length === 0 ? (
        <p className={styles.abilityDescription}>Nenhuma habilidade vinculada a esta classe.</p>
      ) : null}
    </div>
  )
}

