import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { classes } from "@/data/rpg/world-of-clans/classes"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
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
}

type DbSkillLevelRow = {
  skillId: string
  skillName: string
  skillType: string | null
  levelRequired: number
  summary: string | null
  stats: Prisma.JsonValue
  cost: Prisma.JsonValue
}

function parseJsonObject(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function toOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function formatSkillType(type: string | null) {
  if (!type) return null

  switch (type) {
    case "action":
      return "Acao"
    case "bonus":
      return "Bonus"
    case "reaction":
      return "Reacao"
    case "passive":
      return "Passiva"
    default:
      return type
  }
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

              <div className={styles.abilityStats}>
                {ability.damage ? (
                  <div className={styles.statItem}>
                    <strong>Dano</strong>
                    {ability.damage}
                  </div>
                ) : null}
                {ability.range ? (
                  <div className={styles.statItem}>
                    <strong>Alcance</strong>
                    {ability.range}
                  </div>
                ) : null}
                {ability.cooldown ? (
                  <div className={styles.statItem}>
                    <strong>Recarga</strong>
                    {ability.cooldown}
                  </div>
                ) : null}
                {ability.type ? (
                  <div className={styles.statItem}>
                    <strong>Tipo</strong>
                    {ability.type}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const classRows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
    SELECT
      c.id,
      c.key,
      c.label,
      c.rpg_id AS "rpgId",
      r.owner_id AS "ownerId",
      r.visibility
    FROM rpg_class_templates c
    INNER JOIN rpgs r ON r.id = c.rpg_id
    WHERE c.id = ${classId}
      AND c.rpg_id = ${rpgId}
    LIMIT 1
  `)

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

  const levelOneSkills = await prisma.$queryRaw<DbSkillLevelRow[]>(Prisma.sql`
    SELECT
      s.id AS "skillId",
      s.name AS "skillName",
      s.type AS "skillType",
      sl.level_required AS "levelRequired",
      sl.summary,
      sl.stats,
      sl.cost
    FROM skill_class_links scl
    INNER JOIN skills s ON s.id = scl.skill_id
    INNER JOIN skill_levels sl ON sl.skill_id = s.id
    WHERE scl.class_template_id = ${classId}
      AND sl.level_number = 1
    ORDER BY s.name ASC
  `)

  return (
    <div className={styles.container}>
      <h1 className={styles.classTitle}>{dbClass.label}</h1>

      <div className={styles.abilityGrid}>
        {levelOneSkills.map((skill) => {
          const stats = parseJsonObject(skill.stats)
          const cost = parseJsonObject(skill.cost)

          const damage = toOptionalText(stats.damage)
          const range = toOptionalText(stats.range)
          const cooldown = toOptionalText(stats.cooldown)
          const type = formatSkillType(skill.skillType)
          const customCost = toOptionalText(cost.custom)
          const description = skill.summary?.trim() || "Sem descricao para este nivel."

          return (
            <div key={skill.skillId} className={styles.abilityCard}>
              <div className={styles.abilityHeader}>
                <h3 className={styles.abilityName}>{skill.skillName}</h3>
                <span className={styles.abilityLevel}>Nivel 1</span>
              </div>

              <p className={styles.abilityDescription}>{description}</p>

              <div className={styles.abilityStats}>
                {damage ? (
                  <div className={styles.statItem}>
                    <strong>Dano</strong>
                    {damage}
                  </div>
                ) : null}
                {range ? (
                  <div className={styles.statItem}>
                    <strong>Alcance</strong>
                    {range}
                  </div>
                ) : null}
                {cooldown ? (
                  <div className={styles.statItem}>
                    <strong>Recarga</strong>
                    {cooldown}
                  </div>
                ) : null}
                {type ? (
                  <div className={styles.statItem}>
                    <strong>Tipo</strong>
                    {type}
                  </div>
                ) : null}
                {customCost ? (
                  <div className={styles.statItem}>
                    <strong>Custo</strong>
                    <span className={styles.costBadge}>{customCost}</span>
                  </div>
                ) : null}
                <div className={styles.statItem}>
                  <strong>Requisito</strong>
                  Nivel {skill.levelRequired}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {levelOneSkills.length === 0 ? (
        <p className={styles.abilityDescription}>Nenhuma habilidade de nivel 1 vinculada a esta classe.</p>
      ) : null}
    </div>
  )
}
