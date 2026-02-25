import Image from "next/image"
import styles from "./page.module.css"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"
import { STATUS_CATALOG } from "@/lib/rpg/statusCatalog"
import StatusTracker from "./StatusTracker"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

type DbCharacterRow = {
  id: string
  name: string
  image: string | null
  raceKey: string | null
  classKey: string | null
  skillPoints: number
  costResourceName: string
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  progressionMode: string
  progressionLabel: string
  progressionRequired: number
  progressionCurrent: number
  createdByUserId: string | null
  life: number
  defense: number
  mana: number
  exhaustion: number
  sanity: number
  statuses: Prisma.JsonValue
  currentStatuses: Prisma.JsonValue
  attributes: Prisma.JsonValue
  skills: Prisma.JsonValue
  identity: Prisma.JsonValue
  characteristics: Prisma.JsonValue
  createdAt: Date
}

type SkillTemplateLabelRow = {
  key: string
  label: string
}

type StatusTemplateLabelRow = {
  key: string
  label: string
}

type CharacterIdentityTemplateLabelRow = {
  key: string
  label: string
  position?: number
}

type CharacterCharacteristicTemplateLabelRow = {
  key: string
  label: string
  position?: number
}

type RaceTemplateLabelRow = {
  key: string
  label: string
}

type ClassTemplateLabelRow = {
  id: string
  key: string
  label: string
}

type AttributeTemplateLabelRow = {
  key: string
  label: string
}

const skillLabels: Record<string, string> = {
  archery: "Arcos e Flecha",
  crossbow: "Besta",
  tolerance: "Tolerancia",
  smallBlades: "Laminas Pequenas",
  largeBlades: "Laminas Grandes",
  fencing: "Esgrima",
  staffs: "Cajados",
  warArt: "Arte da Guerra",
  athletics: "Atletismo",
  acting: "Atuar",
  stealth: "Esconder-se",
  theft: "Furto",
  brawl: "Briga",
  riding: "Cavalgar",
  navigation: "Navegar",
  intimidate: "Intimidar",
  aim: "Mirar",
  persuade: "Convencer",
  observe: "Observar",
  seduce: "Seduzir",
  history: "Historia",
  acrobatics: "Acrobacia",
  arcanism: "Arcanismo",
  alchemy: "Alquimia",
  spellcasting: "Lancar Feitico",
  magicResistance: "Resistir a Magia",
  religion: "Religiao",
  nature: "Natureza",
  medicine: "Medicina",
  gambling: "Jogos de Aposta",
}

const statusLabelByKey: Record<string, string> = Object.fromEntries(
  STATUS_CATALOG.map((item) => [item.key, item.label]),
)

function getIdentityDisplayName(identity: Record<string, string>) {
  const firstName =
    identity.nome?.trim() ||
    identity.name?.trim() ||
    identity["primeiro-nome"]?.trim() ||
    ""
  const lastName =
    identity.sobrenome?.trim() ||
    identity["last-name"]?.trim() ||
    identity["ultimo-nome"]?.trim() ||
    ""

  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName

  return (
    Object.values(identity).find((value) => value.trim().length > 0)?.trim() ||
    "Personagem"
  )
}

function normalizeLegacyStatusKeys(record: Record<string, number>) {
  const normalized = { ...record }
  if (typeof normalized.stamina === "number" && typeof normalized.exhaustion !== "number") {
    normalized.exhaustion = normalized.stamina
  }
  delete normalized.stamina
  return normalized
}

function getProgressionLevelDisplay(label: string) {
  const match = label.match(/\d+/)
  return match ? match[0] : label
}

export default async function CharactersPage({ params }: Params) {
  const { rpgId, characterId } = await params
  let dbCharacter: DbCharacterRow[] = []
  let skillLabelByKey = new Map<string, string>()
  let statusTemplateLabelByKey = new Map<string, string>()
  let raceTemplateLabelByKey = new Map<string, string>()
  let classTemplateLabelByKey = new Map<string, string>()
  let classTemplateIdByKey = new Map<string, string>()
  let attributeLabelByKey = new Map<string, string>()
  let identityTemplateFields: CharacterIdentityTemplateLabelRow[] = []
  let characteristicsTemplateFields: CharacterCharacteristicTemplateLabelRow[] = []
  let userId: string | null = null
  let isOwner = false
  let canManageRpg = false
  let usersCanManageOwnXp = true
  let rpgProgressionMode: ProgressionMode = "xp_level"
  let rpgProgressionTiers: ProgressionTier[] = getDefaultProgressionTiers("xp_level")

    try {
      let dbRpg:
        | {
            id: string
            ownerId: string
            visibility: "private" | "public"
            usersCanManageOwnXp: boolean
          }
        | null = null
      try {
        const rpgRows = await prisma.$queryRaw<
          Array<{
            id: string
            ownerId: string
            visibility: "private" | "public"
            usersCanManageOwnXp: boolean
          }>
        >(Prisma.sql`
          SELECT
            id,
            owner_id AS "ownerId",
            visibility,
            COALESCE(users_can_manage_own_xp, true) AS "usersCanManageOwnXp"
          FROM rpgs
          WHERE id = ${rpgId}
          LIMIT 1
        `)
        dbRpg = rpgRows[0] ?? null
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !error.message.includes('column "users_can_manage_own_xp" does not exist')
        ) {
          throw error
        }
        const rpgRows = await prisma.$queryRaw<
          Array<{
            id: string
            ownerId: string
            visibility: "private" | "public"
            usersCanManageOwnXp: boolean
          }>
        >(Prisma.sql`
          SELECT
            id,
            owner_id AS "ownerId",
            visibility,
            true AS "usersCanManageOwnXp"
          FROM rpgs
          WHERE id = ${rpgId}
          LIMIT 1
        `)
        dbRpg = rpgRows[0] ?? null
      }

      if (!dbRpg) {
        notFound()
      }

      userId = await getUserIdFromCookieStore()
      usersCanManageOwnXp = Boolean(dbRpg.usersCanManageOwnXp)
      try {
        const progressionRows = await prisma.$queryRaw<
          Array<{ progressionMode: string; progressionTiers: Prisma.JsonValue }>
        >(Prisma.sql`
          SELECT
            COALESCE(progression_mode, 'xp_level') AS "progressionMode",
            COALESCE(progression_tiers, '[{"label":"Level 1","required":0},{"label":"Level 2","required":100}]'::jsonb) AS "progressionTiers"
          FROM rpgs
          WHERE id = ${rpgId}
          LIMIT 1
        `)
        const mode = isProgressionMode(progressionRows[0]?.progressionMode)
          ? progressionRows[0].progressionMode
          : ("xp_level" as ProgressionMode)
        rpgProgressionMode = mode
        rpgProgressionTiers = normalizeProgressionTiers(
          progressionRows[0]?.progressionTiers,
          mode,
        )
      } catch (error) {
        if (
          !(error instanceof Error) ||
          (!error.message.includes('column "progression_mode" does not exist') &&
            !error.message.includes('column "progression_tiers" does not exist'))
        ) {
          throw error
        }
        rpgProgressionMode = "xp_level"
        rpgProgressionTiers = getDefaultProgressionTiers("xp_level")
      }
      if (userId) {
        const permission = await getRpgPermission(rpgId, userId)
        isOwner = permission.isOwner
        canManageRpg = permission.canManage
      } else {
        isOwner = false
        canManageRpg = false
      }
      let isAcceptedMember = false

      if (userId && !isOwner) {
        isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
      }

      if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
        notFound()
      }

      try {
        dbCharacter = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
          SELECT
            c.id,
            c.name,
            c.image,
            c.race_key AS "raceKey",
            c.class_key AS "classKey",
            c.skill_points AS "skillPoints",
            COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName",
            c.character_type AS "characterType",
            c.visibility,
            COALESCE(c.progression_mode, 'xp_level') AS "progressionMode",
            COALESCE(c.progression_label, 'Level 1') AS "progressionLabel",
            COALESCE(c.progression_required, 0) AS "progressionRequired",
            COALESCE(c.progression_current, 0) AS "progressionCurrent",
            c.created_by_user_id AS "createdByUserId",
            c.life,
            c.defense,
            c.mana,
            c.stamina AS exhaustion,
            c.sanity,
            c.statuses,
            COALESCE(c.current_statuses, '{}'::jsonb) AS "currentStatuses",
            c.attributes,
            c.skills,
            COALESCE(c.identity, '{}'::jsonb) AS identity,
            COALESCE(c.characteristics, '{}'::jsonb) AS characteristics,
            c.created_at AS "createdAt"
          FROM rpg_characters c
          INNER JOIN rpgs r ON r.id = c.rpg_id
          WHERE c.id = ${characterId}
            AND c.rpg_id = ${rpgId}
          LIMIT 1
        `)
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes('column "skill_points" does not exist') ||
            error.message.includes('column "cost_resource_name" does not exist') ||
            error.message.includes('column "progression_mode" does not exist') ||
            error.message.includes('column "progression_label" does not exist') ||
            error.message.includes('column "progression_required" does not exist') ||
            error.message.includes('column "progression_current" does not exist'))
        ) {
          dbCharacter = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
            SELECT
              c.id,
              c.name,
              c.image,
              c.race_key AS "raceKey",
              c.class_key AS "classKey",
              0::integer AS "skillPoints",
              'Skill Points' AS "costResourceName",
              c.character_type AS "characterType",
              c.visibility,
              'xp_level'::text AS "progressionMode",
              'Level 1'::text AS "progressionLabel",
              0::integer AS "progressionRequired",
              0::integer AS "progressionCurrent",
              c.created_by_user_id AS "createdByUserId",
              c.life,
              c.defense,
              c.mana,
              c.stamina AS exhaustion,
              c.sanity,
              c.statuses,
              COALESCE(c.current_statuses, '{}'::jsonb) AS "currentStatuses",
              c.attributes,
              c.skills,
              COALESCE(c.identity, '{}'::jsonb) AS identity,
              COALESCE(c.characteristics, '{}'::jsonb) AS characteristics,
              c.created_at AS "createdAt"
            FROM rpg_characters c
            WHERE c.id = ${characterId}
              AND c.rpg_id = ${rpgId}
            LIMIT 1
          `)
        } else {
          throw error
        }
      }

      const skillLabels = await prisma.$queryRaw<SkillTemplateLabelRow[]>(Prisma.sql`
        SELECT key, label
        FROM rpg_skill_templates
        WHERE rpg_id = ${rpgId}
      `)
      skillLabelByKey = new Map(skillLabels.map((item) => [item.key, item.label]))

      const statusLabels = await prisma.$queryRaw<StatusTemplateLabelRow[]>(Prisma.sql`
        SELECT key, label
        FROM rpg_status_templates
        WHERE rpg_id = ${rpgId}
      `)
      statusTemplateLabelByKey = new Map(statusLabels.map((item) => [item.key, item.label]))

      const identityLabels = await prisma.$queryRaw<CharacterIdentityTemplateLabelRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_character_identity_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
      identityTemplateFields = identityLabels

      const characteristicsLabels = await prisma.$queryRaw<CharacterCharacteristicTemplateLabelRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_character_characteristic_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
      characteristicsTemplateFields = characteristicsLabels

      const attributeTemplateLabels = await prisma.$queryRaw<AttributeTemplateLabelRow[]>(Prisma.sql`
        SELECT key, label
        FROM rpg_attribute_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
      attributeLabelByKey = new Map(attributeTemplateLabels.map((item) => [item.key, item.label]))

      const raceLabels = await prisma.$queryRaw<RaceTemplateLabelRow[]>(Prisma.sql`
        SELECT key, label
        FROM rpg_race_templates
        WHERE rpg_id = ${rpgId}
      `)
      raceTemplateLabelByKey = new Map(raceLabels.map((item) => [item.key, item.label]))

      const classLabels = await prisma.$queryRaw<ClassTemplateLabelRow[]>(Prisma.sql`
        SELECT id, key, label
        FROM rpg_class_templates
        WHERE rpg_id = ${rpgId}
      `)
      classTemplateLabelByKey = new Map(classLabels.map((item) => [item.key, item.label]))
      classTemplateIdByKey = new Map(classLabels.map((item) => [item.key, item.id]))
    } catch {
      dbCharacter = []
      skillLabelByKey = new Map()
      statusTemplateLabelByKey = new Map()
      raceTemplateLabelByKey = new Map()
      classTemplateLabelByKey = new Map()
      classTemplateIdByKey = new Map()
      identityTemplateFields = []
      characteristicsTemplateFields = []
      attributeLabelByKey = new Map()
    }

    if (dbCharacter.length === 0) {
      notFound()
    }

    const row = dbCharacter[0]
    const canEditCharacter = Boolean(userId && (isOwner || row.createdByUserId === userId))

    if (
      row.visibility === "private" &&
      !isOwner &&
      (!userId || row.createdByUserId !== userId)
    ) {
      notFound()
    }

    const attributes = row.attributes as Record<string, number>
    const statuses = normalizeLegacyStatusKeys(row.statuses as Record<string, number>)
    const currentStatuses = normalizeLegacyStatusKeys(
      row.currentStatuses as Record<string, number>,
    )
    const skills = row.skills as Record<string, number>
    const skillEntries = Object.entries(skills).filter(([, value]) => Number(value) > 0)
    const identity = row.identity as Record<string, string>
    const characteristics = row.characteristics as Record<string, string>
    const attributeEntries = Object.entries(attributes).filter(
      ([key, value]) => attributeLabelByKey.has(key) && Number(value) > 0,
    )
    const displayName = getIdentityDisplayName(identity)
    const progressionMode = isProgressionMode(row.progressionMode)
      ? row.progressionMode
      : rpgProgressionMode
    const progressionTiers = normalizeProgressionTiers(rpgProgressionTiers, progressionMode)
    const nextProgressionTier =
      [...progressionTiers]
        .sort((left, right) => left.required - right.required)
        .find((item) => item.required > row.progressionCurrent) ?? null
    const coreStatusConfig = [
      { key: "life", label: statusTemplateLabelByKey.get("life") ?? statusLabelByKey.life ?? "Vida" },
      { key: "mana", label: statusTemplateLabelByKey.get("mana") ?? statusLabelByKey.mana ?? "Mana" },
      { key: "sanity", label: statusTemplateLabelByKey.get("sanity") ?? statusLabelByKey.sanity ?? "Sanidade" },
      {
        key: "exhaustion",
        label:
          statusTemplateLabelByKey.get("exhaustion") ??
          statusTemplateLabelByKey.get("stamina") ??
          "Exaustão",
      },
    ]
    const extraStatusEntries = Object.entries(statuses).filter(
      ([key, value]) =>
        !coreStatusConfig.some((item) => item.key === key) && Number(value) > 0,
    )
    const statusEntries = [
      ...coreStatusConfig.map((item) => ({
        key: item.key,
        label: item.label,
        max: Number(statuses[item.key] ?? 0),
        current:
          item.key === "life"
            ? Number(row.life ?? 0)
            : item.key === "mana"
              ? Number(row.mana ?? 0)
              : item.key === "sanity"
                ? Number(row.sanity ?? 0)
                : Number(row.exhaustion ?? 0),
      })),
      ...extraStatusEntries.map(([key, value]) => ({
        key,
        label: statusTemplateLabelByKey.get(key) ?? statusLabelByKey[key] ?? key,
        max: Number(value ?? 0),
        current: Math.max(
          0,
          Math.min(Number(value ?? 0), Number(currentStatuses[key] ?? value ?? 0)),
        ),
      })),
    ].filter((item) => item.max > 0)
    const identityItems =
      identityTemplateFields.length > 0
        ? identityTemplateFields.map((field) => ({
            key: field.key,
            label: field.label,
            value: identity[field.key] ?? "",
          }))
        : Object.entries(identity).map(([key, value]) => ({
            key,
            label: key,
            value,
          }))
    const identityItemsWithRaceClass = [
      ...identityItems,
      ...(row.raceKey
        ? [
            {
              key: "race-key",
              label: "Raca",
              value: raceTemplateLabelByKey.get(row.raceKey) ?? row.raceKey,
              href: `/rpg/${rpgId}/races/${row.raceKey}`,
            },
          ]
        : []),
      ...(row.classKey
        ? [
            {
              key: "class-key",
              label: "Classe",
              value: classTemplateLabelByKey.get(row.classKey) ?? row.classKey,
              href: classTemplateIdByKey.get(row.classKey)
                ? `/rpg/${rpgId}/classes/${classTemplateIdByKey.get(row.classKey)}`
                : undefined,
            },
          ]
        : []),
    ]
    const characteristicsItems =
      characteristicsTemplateFields.length > 0
        ? characteristicsTemplateFields.map((field) => ({
            key: field.key,
            label: field.label,
            value: characteristics[field.key] ?? "",
          }))
        : Object.entries(characteristics).map(([key, value]) => ({
            key,
            label: key,
            value,
          }))

  return (
    <div className={styles.page}>
      <section className={styles.card}>
          <div className={styles.titleBar}>
            <div className={styles.titleInfo}>
              <h3>{displayName}</h3>
              {row.characterType === "player" ? (
                <p className={styles.pointsLabel}>
                  {row.costResourceName}: {row.skillPoints}
                </p>
              ) : null}
            </div>
            <div className={styles.titleActions}>
              <Link className={styles.editInlineButton} href={`/rpg/${rpgId}/characters`}>
                Voltar
              </Link>
              {canEditCharacter ? (
                <Link
                  className={styles.editInlineButton}
                  href={`/rpg/${rpgId}/characters/new?characterId=${row.id}`}
                >
                  Editar
                </Link>
              ) : null}
            </div>
          </div>
          <div className={styles.header}>
            <div className={styles.imageColumn}>
              <Image
                src={row.image ?? "/images/bg-characters.jpg"}
                alt={displayName}
                width={150}
                height={192}
                priority
              />
         
            </div>
            <div className={styles.identityInfo}>
              <div className={styles.actionLinks}>
                     <Link
                className={`${styles.actionLink} ${styles.imageActionLink}`}
                href={`/rpg/${rpgId}/characters/${characterId}/inventory`}
              >
                Inventario
              </Link>
                <Link className={styles.actionLink} href={`/rpg/${rpgId}/characters/${characterId}/abilities`}>
                  Habilidades
                </Link>
              </div>

              <p className={styles.kingdom}>
                Tipo:{" "}
                {row.characterType === "player"
                  ? "Player"
                  : row.characterType === "npc"
                    ? "NPC"
                    : "Monstro"}
              </p>
            </div>
          </div>

          {statusEntries.length > 0 ? (
            <div className={styles.grid}>
              <div>
                <h4>Status</h4>
                <StatusTracker
                  items={statusEntries}
                  rpgId={rpgId}
                  characterId={row.id}
                  canPersist={canEditCharacter}
                />
              </div>
            </div>
          ) : null}

          {attributeEntries.length > 0 || skillEntries.length > 0 ? (
            <div className={styles.containerSkillAttributes}>
              {attributeEntries.length > 0 ? (
                <div>
                  <h4>Atributos</h4>
                  <ul className={styles.list}>
                    {attributeEntries.map(([key, value]) => (
                      <li key={key}>
                        {attributeLabelByKey.get(key)}: {value}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {skillEntries.length > 0 ? (
                <div>
                  <h4>Pericias</h4>
                  <ul className={styles.list}>
                    {skillEntries.map(([key, value]) => (
                      <li key={key}>
                        {skillLabelByKey.get(key) ?? skillLabels[key] ?? key}: {value}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.grid}>
            <div>
              <h4>Progressao</h4>
              <p>Level: {getProgressionLevelDisplay(row.progressionLabel)}</p>
              <p>XP: {row.progressionCurrent}</p>
              {usersCanManageOwnXp ? (
                <p>
                  Proximo level:{" "}
                  {nextProgressionTier
                    ? `${nextProgressionTier.label} (${nextProgressionTier.required})`
                    : "Maximo"}
                </p>
              ) : null}
            </div>

            {identityItemsWithRaceClass.length > 0 ? (
              <div>
                <h4>Identidade</h4>
                {identityItemsWithRaceClass.map((item) => (
                  <p key={item.key}>
                    {item.label}:{" "}
                    {"href" in item && item.href ? (
                      <Link className={styles.identityLink} href={item.href}>
                        {item.value.trim() || "-"}
                      </Link>
                    ) : (
                      item.value.trim() || "-"
                    )}
                  </p>
                ))}
              </div>
            ) : null}

            {characteristicsItems.length > 0 ? (
              <div>
                <h4>Caracteristicas</h4>
                {characteristicsItems.map((item) => (
                  <p key={item.key}>
                    {item.label}: {item.value.trim() || "-"}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.actionLinks}>
            <Link className={styles.actionLink} href={`/rpg/${rpgId}/characters`}>
              Voltar para personagens
            </Link>
          </div>
      </section>
    </div>
  )
}

