import { notFound } from "next/navigation"
import Link from "next/link"
import { Prisma } from "../../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { parseCharacterAbilities, parseCostPoints } from "@/lib/server/costSystem"
import AbilitiesFiltersClient from "./AbilitiesFiltersClient"
import styles from "./page.module.css"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

type DbCharacterRow = {
  id: string
  rpgId: string
  name: string
  classKey: string | null
  visibility: "private" | "public"
  characterType: "player" | "npc" | "monster"
  createdByUserId: string | null
  abilities: Prisma.JsonValue
}

type DbClassRow = {
  id: string
  key: string
  label: string
}

type DbPurchasedSkillLevelRow = {
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

type PurchasedAbilityView = {
  skillId: string
  levelNumber: number
  skillName: string
  levelName: string | null
  skillDescription: string | null
  levelDescription: string | null
  notesList: string[]
  skillCategory: string | null
  skillType: string | null
  levelRequired: number
  summary: string | null
  damage: string | null
  range: string | null
  cooldown: string | null
  duration: string | null
  castTime: string | null
  resourceCost: string | null
  pointsCost: number | null
  costCustom: string | null
}

function parseJsonObject(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export default async function AbilitiesPage({ params }: Params) {
  const { rpgId, characterId } = await params

  const dbRpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true, visibility: true },
  })
  if (!dbRpg) {
    notFound()
  }

  const userId = await getUserIdFromCookieStore()
  const isOwner = userId === dbRpg.ownerId
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  const characterRows = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
    SELECT
      id,
      rpg_id AS "rpgId",
      name,
      class_key AS "classKey",
      visibility,
      character_type AS "characterType",
      created_by_user_id AS "createdByUserId",
      COALESCE(abilities, '[]'::jsonb) AS abilities
    FROM rpg_characters
    WHERE id = ${characterId}
      AND rpg_id = ${rpgId}
    LIMIT 1
  `)
  const character = characterRows[0]
  if (!character) {
    notFound()
  }

  const canViewAbilities = Boolean(userId && (isOwner || character.createdByUserId === userId))
  if (!canViewAbilities) {
    notFound()
  }

  const classRows = character.classKey
    ? await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
        SELECT id, key, label
        FROM rpg_class_templates
        WHERE rpg_id = ${rpgId}
          AND (
            key = ${character.classKey}
            OR id = ${character.classKey}
          )
        LIMIT 1
      `)
    : []
  const classLabel = classRows[0]?.label ?? character.classKey ?? "Sem classe"

  const owned = parseCharacterAbilities(character.abilities)
  const ownedSkillIds = Array.from(new Set(owned.map((item) => item.skillId)))

  const purchasedRows =
    ownedSkillIds.length > 0
      ? await prisma.$queryRaw<DbPurchasedSkillLevelRow[]>(Prisma.sql`
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
          FROM skills s
          INNER JOIN skill_levels sl ON sl.skill_id = s.id
          WHERE s.rpg_id = ${rpgId}
            AND s.id IN (${Prisma.join(ownedSkillIds)})
        `)
      : []

  const levelBySkillAndLevel = new Map<string, DbPurchasedSkillLevelRow>()
  for (const row of purchasedRows) {
    levelBySkillAndLevel.set(`${row.skillId}:${row.levelNumber}`, row)
  }

  const abilities = owned.reduce<PurchasedAbilityView[]>((acc, ownedLevel) => {
      const row = levelBySkillAndLevel.get(`${ownedLevel.skillId}:${ownedLevel.level}`)
      if (!row) return acc

      const stats = parseJsonObject(row.stats) ?? {}
      const cost = parseJsonObject(row.cost) ?? {}
      const statsNotesListRaw = Array.isArray(stats.notesList) ? stats.notesList : []
      const statsNotesList = statsNotesListRaw
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
      const fallbackNote = toOptionalText(stats.notes)

      acc.push({
        skillId: row.skillId,
        levelNumber: row.levelNumber,
        skillName: row.skillName,
        levelName: toOptionalText(stats.name),
        skillDescription: toOptionalText(row.skillDescription),
        levelDescription: toOptionalText(stats.description),
        notesList: statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : [],
        skillCategory: toOptionalText(row.skillCategory),
        skillType: toOptionalText(row.skillType),
        levelRequired: row.levelRequired,
        summary: toOptionalText(row.summary),
        damage: toOptionalText(stats.damage),
        range: toOptionalText(stats.range),
        cooldown: toOptionalText(stats.cooldown),
        duration: toOptionalText(stats.duration),
        castTime: toOptionalText(stats.castTime),
        resourceCost: toOptionalText(stats.resourceCost),
        pointsCost: parseCostPoints(row.cost),
        costCustom: toOptionalText(cost.custom),
      })

      return acc
    }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Habilidades</p>
          <h1 className={styles.title}>
            <Link
              href={`/rpg/${rpgId}/characters/${characterId}`}
              className={styles.titleLink}
            >
              {character.name}
            </Link>
          </h1>
        </div>
        <div className={styles.badge}>Classe: {classLabel}</div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Habilidades do Personagem</h2>
        {abilities.length === 0 ? (
          <p className={styles.emptyState}>Nenhuma habilidade comprada para este personagem.</p>
        ) : (
          <AbilitiesFiltersClient abilities={abilities} />
        )}
      </section>
    </div>
  )
}

