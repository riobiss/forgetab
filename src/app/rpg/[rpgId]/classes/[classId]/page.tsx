import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { parseCharacterAbilities, parseCostPoints } from "@/lib/server/costSystem"
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
}

type DbSkillLevelRow = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Prisma.JsonValue
  cost: Prisma.JsonValue
  target: Prisma.JsonValue
  area: Prisma.JsonValue
  scaling: Prisma.JsonValue
  requirement: Prisma.JsonValue
  effects: Prisma.JsonValue
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
  levelName: string | null
  levelDescription: string | null
  notes: string | null
  notesList: string[]
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
  effects: unknown[]
}

type SkillView = {
  skillId: string
  skillName: string
  skillDescription: string | null
  skillCategory: string | null
  skillType: string | null
  levels: SkillLevelView[]
}

function parseJsonObject(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function parseJsonArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value : []
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
        COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName"
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
        error.message.includes('column "cost_resource_name" does not exist'))
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
          'Skill Points' AS "costResourceName"
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

  const userId = await getUserIdFromCookieStore()
  const isOwner = userId === dbClass.ownerId
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (dbClass.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  const levelRows = await prisma.$queryRaw<DbSkillLevelRow[]>(Prisma.sql`
    SELECT
      s.id AS "skillId",
      s.name AS "skillName",
      s.description AS "skillDescription",
      s.category AS "skillCategory",
      s.type AS "skillType",
      sl.level_number AS "levelNumber",
      sl.level_required AS "levelRequired",
      sl.summary,
      sl.stats,
      sl.cost,
      sl.target,
      sl.area,
      sl.scaling,
      sl.requirement,
      COALESCE(sl.effects, '[]'::jsonb) AS effects
    FROM skill_class_links scl
    INNER JOIN skills s ON s.id = scl.skill_id
    INNER JOIN skill_levels sl ON sl.skill_id = s.id
    WHERE scl.class_template_id = ${classId}
    ORDER BY s.name ASC, sl.level_number ASC
  `)

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
      levels: [],
    }

    skill.levels.push({
      levelNumber: row.levelNumber,
      levelRequired: row.levelRequired,
      upgradeFromLevelNumber,
      levelName: toOptionalText(stats.name),
      levelDescription: toOptionalText(stats.description),
      notes: fallbackNote,
      notesList: statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : [],
      description: row.skillDescription?.trim() || null,
      summary: row.summary?.trim() || null,
      damage: toOptionalText(stats.damage),
      range: toOptionalText(stats.range),
      cooldown: toOptionalText(stats.cooldown),
      duration: toOptionalText(stats.duration),
      castTime: toOptionalText(stats.castTime),
      resourceCost: toOptionalText(stats.resourceCost),
      pointsCost: parseCostPoints(row.cost),
      costCustom: toOptionalText(cost.custom),
      target: parseJsonObject(row.target),
      area: parseJsonObject(row.area),
      scaling: parseJsonObject(row.scaling),
      requirement,
      effects: parseJsonArray(row.effects),
    })

    acc[row.skillId] = skill
    return acc
  }, {})

  const skills = Object.values(grouped)

  return (
    <div className={styles.container}>
      <h1 className={styles.classTitle}>{dbClass.label}</h1>

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

