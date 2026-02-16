import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { parseCharacterAbilities, parseCostPoints } from "@/lib/server/costSystem"
import players from "@/data/rpg/world-of-clans/entities/player"
import { classes } from "@/data/rpg/world-of-clans/classes"
import styles from "./page.module.css"

const SKILL_CATEGORY_LABEL: Record<string, string> = {
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

const SKILL_TYPE_LABEL: Record<string, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

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
  skillDescription: string | null
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
  target: Record<string, unknown> | null
  area: Record<string, unknown> | null
  scaling: Record<string, unknown> | null
  requirement: Record<string, unknown> | null
  effects: Prisma.JsonArray
}

function parseJsonObject(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function parseJsonArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value : []
}

function toOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function toCategoryLabel(value: string | null) {
  if (!value) return null
  return SKILL_CATEGORY_LABEL[value] ?? value
}

function toTypeLabel(value: string | null) {
  if (!value) return null
  return SKILL_TYPE_LABEL[value] ?? value
}

function renderJsonBlock(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) {
    return "-"
  }

  return <pre className={styles.jsonBlock}>{JSON.stringify(value, null, 2)}</pre>
}

function renderEffects(value: Prisma.JsonArray) {
  if (!Array.isArray(value) || value.length === 0) {
    return "-"
  }

  return <pre className={styles.jsonBlock}>{JSON.stringify(value, null, 2)}</pre>
}

export default async function AbilitiesPage({ params }: Params) {
  const { rpgId, characterId } = await params

  const staticCharacter = players.find(
    (player) => player.id === characterId && String(player.meta.version) === rpgId,
  )
  if (staticCharacter) {
    const classKey = staticCharacter.identity.class
    const classData = classes.find((item) => item.id === classKey || item.name === classKey)
    const abilityIds = new Set([
      ...staticCharacter.abilities.classMainIds,
      ...staticCharacter.abilities.classReinforcementIds,
    ])
    const classAbilities = classData?.abilities ?? []
    const ownedAbilities = classAbilities.filter((ability) => abilityIds.has(ability.id))

    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Habilidades</p>
            <h1 className={styles.title}>{staticCharacter.identity.name}</h1>
          </div>
          <div className={styles.badge}>Classe: {classData?.name ?? "Desconhecida"}</div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Habilidades do Personagem</h2>
          {ownedAbilities.length === 0 ? (
            <p className={styles.emptyState}>Nenhuma habilidade cadastrada.</p>
          ) : (
            <div className={styles.cardGrid}>
              {ownedAbilities.map((ability) => (
                <article key={ability.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{ability.name}</h3>
                    <span className={styles.levelBadge}>Nivel {ability.level}</span>
                  </div>
                  <p className={styles.cardBodyItalic}>{ability.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

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

  if (
    character.visibility === "private" &&
    !isOwner &&
    (!userId || character.createdByUserId !== userId)
  ) {
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

      acc.push({
        skillId: row.skillId,
        levelNumber: row.levelNumber,
        skillName: row.skillName,
        skillDescription: toOptionalText(row.skillDescription),
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
        target: parseJsonObject(row.target),
        area: parseJsonObject(row.area),
        scaling: parseJsonObject(row.scaling),
        requirement: parseJsonObject(row.requirement),
        effects: parseJsonArray(row.effects),
      })

      return acc
    }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Habilidades</p>
          <h1 className={styles.title}>{character.name}</h1>
        </div>
        <div className={styles.badge}>Classe: {classLabel}</div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Habilidades do Personagem</h2>
        {abilities.length === 0 ? (
          <p className={styles.emptyState}>Nenhuma habilidade comprada para este personagem.</p>
        ) : (
          <div className={styles.cardGrid}>
            {abilities.map((ability) => (
              <article key={`${ability.skillId}:${ability.levelNumber}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{ability.skillName}</h3>
                  <span className={styles.levelBadge}>Nivel {ability.levelNumber}</span>
                </div>

                {ability.skillDescription ? (
                  <p className={styles.cardBodyItalic}>{ability.skillDescription}</p>
                ) : null}
                <p className={styles.cardBodyItalic}>{ability.summary ?? "Sem resumo do nivel."}</p>

                <div className={styles.cardDetailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CATEGORIA</span>
                    <span className={styles.detailValue}>
                      {toCategoryLabel(ability.skillCategory) ?? "-"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>TIPO</span>
                    <span className={styles.detailValue}>{toTypeLabel(ability.skillType) ?? "-"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>REQUISITO</span>
                    <span className={styles.detailValue}>Nivel {ability.levelRequired}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>DANO</span>
                    <span className={styles.detailValue}>{ability.damage ?? "-"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>ALCANCE</span>
                    <span className={styles.detailValue}>{ability.range ?? "-"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>RECARGA</span>
                    <span className={styles.detailValue}>{ability.cooldown ?? "-"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>DURACAO</span>
                    <span className={styles.detailValue}>{ability.duration ?? "-"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CONJURACAO</span>
                    <span className={styles.detailValue}>{ability.castTime ?? "-"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CUSTO RECURSO</span>
                    <span className={styles.detailValue}>{ability.resourceCost ?? "-"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CUSTO PONTOS</span>
                    <span className={styles.detailValueHighlight}>
                      {ability.pointsCost === null ? "-" : String(ability.pointsCost)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>CUSTO CUSTOM</span>
                    <span className={styles.detailValue}>{ability.costCustom ?? "-"}</span>
                  </div>
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>ALVO</span>
                    {renderJsonBlock(ability.target)}
                  </div>
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>AREA</span>
                    {renderJsonBlock(ability.area)}
                  </div>
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>ESCALONAMENTO</span>
                    {renderJsonBlock(ability.scaling)}
                  </div>
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>REQUISITOS</span>
                    {renderJsonBlock(ability.requirement)}
                  </div>
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabelOrange}>EFEITOS</span>
                    {renderEffects(ability.effects)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
