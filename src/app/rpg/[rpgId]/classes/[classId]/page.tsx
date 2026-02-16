import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { classes } from "@/data/rpg/world-of-clans/classes"
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
  skillType: string | null
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Prisma.JsonValue
  cost: Prisma.JsonValue
}

type DbCharacterRow = {
  id: string
  skillPoints: number
  abilities: Prisma.JsonValue
}

type SkillLevelView = {
  levelNumber: number
  levelRequired: number
  summary: string
  damage: string | null
  range: string | null
  cooldown: string | null
  pointsCost: number | null
}

type SkillView = {
  skillId: string
  skillName: string
  skillType: string | null
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

  const staticClass = classes.find((item) => item.id === classId)
  if (staticClass) {
    return (
      <div className={styles.container}>
        <h1 className={styles.classTitle}>{staticClass.name}</h1>
        <div className={styles.abilityGrid}>
          {staticClass.abilities.map((ability) => (
            <div key={ability.id} className={styles.abilityCard}>
              <div className={styles.abilityHeader}>
                <h3 className={styles.abilityName}>{ability.name}</h3>
                <span className={styles.abilityLevel}>Nivel {ability.level}</span>
              </div>
              <p className={styles.abilityDescription}>{ability.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

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
      s.type AS "skillType",
      sl.level_number AS "levelNumber",
      sl.level_required AS "levelRequired",
      sl.summary,
      sl.stats,
      sl.cost
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
          AND created_by_user_id = ${userId}
          AND character_type = 'player'::"RpgCharacterType"
          AND class_key = ${dbClass.key}
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
    const skill = acc[row.skillId] ?? {
      skillId: row.skillId,
      skillName: row.skillName,
      skillType: row.skillType,
      levels: [],
    }

    skill.levels.push({
      levelNumber: row.levelNumber,
      levelRequired: row.levelRequired,
      summary: row.summary?.trim() || "Sem descricao para este nivel.",
      damage: toOptionalText(stats.damage),
      range: toOptionalText(stats.range),
      cooldown: toOptionalText(stats.cooldown),
      pointsCost: parseCostPoints(row.cost),
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
