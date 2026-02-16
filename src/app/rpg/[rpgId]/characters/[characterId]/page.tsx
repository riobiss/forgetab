import Image from "next/image"
import styles from "./page.module.css"
import players from "@/data/rpg/world-of-clans/entities/player"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../../../generated/prisma/client"
import { formatDateInBrasilia } from "@/lib/date"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { ATTRIBUTE_CATALOG } from "@/lib/rpg/attributeCatalog"
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
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  createdByUserId: string | null
  life: number
  defense: number
  mana: number
  stamina: number
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

const attributeLabelByKey: Record<string, string> = Object.fromEntries(
  ATTRIBUTE_CATALOG.map((item) => [item.key, item.label]),
)
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

export default async function CharactersPage({ params }: Params) {
  const { rpgId, characterId } = await params
  const character = players.find((p) => p.id === characterId)

  if (!character) {
    let dbCharacter: DbCharacterRow[] = []
    let skillLabelByKey = new Map<string, string>()
    let statusTemplateLabelByKey = new Map<string, string>()
    let identityTemplateFields: CharacterIdentityTemplateLabelRow[] = []
    let characteristicsTemplateFields: CharacterCharacteristicTemplateLabelRow[] = []
    let userId: string | null = null
    let isOwner = false

    try {
      const dbRpg = await prisma.rpg.findUnique({
        where: { id: rpgId },
        select: {
          id: true,
          ownerId: true,
          visibility: true,
        },
      })

      if (!dbRpg) {
        notFound()
      }

      userId = await getUserIdFromCookieStore()
      isOwner = userId === dbRpg.ownerId
      let isAcceptedMember = false

      if (userId && !isOwner) {
        isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
      }

      if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
        notFound()
      }

      dbCharacter = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
        SELECT
          id,
          name,
          image,
          race_key AS "raceKey",
          class_key AS "classKey",
          character_type AS "characterType",
          visibility,
          created_by_user_id AS "createdByUserId",
          life,
          defense,
          mana,
          stamina,
          sanity,
          statuses,
          COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses",
          attributes,
          skills,
          COALESCE(identity, '{}'::jsonb) AS identity,
          COALESCE(characteristics, '{}'::jsonb) AS characteristics,
          created_at AS "createdAt"
        FROM rpg_characters
        WHERE id = ${characterId}
          AND rpg_id = ${rpgId}
        LIMIT 1
      `)

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
    } catch {
      dbCharacter = []
      skillLabelByKey = new Map()
      statusTemplateLabelByKey = new Map()
      identityTemplateFields = []
      characteristicsTemplateFields = []
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
    const statuses = row.statuses as Record<string, number>
    const currentStatuses = row.currentStatuses as Record<string, number>
    const skills = row.skills as Record<string, number>
    const skillEntries = Object.entries(skills)
    const identity = row.identity as Record<string, string>
    const characteristics = row.characteristics as Record<string, string>
    const displayName = getIdentityDisplayName(identity)
    const coreStatusConfig = [
      { key: "life", label: statusTemplateLabelByKey.get("life") ?? statusLabelByKey.life ?? "Vida" },
      { key: "mana", label: statusTemplateLabelByKey.get("mana") ?? statusLabelByKey.mana ?? "Mana" },
      { key: "sanity", label: statusTemplateLabelByKey.get("sanity") ?? statusLabelByKey.sanity ?? "Sanidade" },
      { key: "stamina", label: statusTemplateLabelByKey.get("stamina") ?? "Exaustao" },
    ]
    const extraStatusEntries = Object.entries(statuses).filter(
      ([key]) => !coreStatusConfig.some((item) => item.key === key),
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
                : Number(row.stamina ?? 0),
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
    ]
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
        ? [{ key: "race-key", label: "Raca", value: row.raceKey }]
        : []),
      ...(row.classKey
        ? [{ key: "class-key", label: "Classe", value: row.classKey }]
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
            <h3>{displayName}</h3>
            <div className={styles.titleActions}>
              <Link className={styles.editInlineButton} href={`/rpg/${rpgId}/characters`}>
                Voltar
              </Link>
              {canEditCharacter ? (
                <Link
                  className={styles.editInlineButton}
                  href={`/rpg/${rpgId}/characters/novo?characterId=${row.id}`}
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
              <Link
                className={`${styles.actionLink} ${styles.imageActionLink}`}
                href={`/rpg/${rpgId}/characters/${characterId}/inventory`}
              >
                Inventario
              </Link>
            </div>
            <div className={styles.identityInfo}>
              <div className={styles.actionLinks}>
                <Link className={styles.actionLink} href={`/rpg/${rpgId}/characters/${characterId}/abilities`}>
                  Habilidades
                </Link>
                <Link className={styles.actionLink} href={`/rpg/${rpgId}/characters/${characterId}/inventory`}>
                  Equipamentos
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

          <div className={styles.containerSkillAttributes}>
            <div>
              <h4>Atributos</h4>
              <ul className={styles.list}>
                {Object.entries(attributes).map(([key, value]) => (
                  <li key={key}>
                    {attributeLabelByKey[key] ?? key}: {value}
                  </li>
                ))}
              </ul>
            </div>

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

          <div className={styles.grid}>
            {identityItemsWithRaceClass.length > 0 ? (
              <div>
                <h4>Identidade</h4>
                {identityItemsWithRaceClass.map((item) => (
                  <p key={item.key}>
                    {item.label}: {item.value.trim() || "-"}
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

  return (
    <div className={styles.page}>
      <section key={character.id} className={styles.card}>
        <div className={styles.titleBar}>
          <h3>{character.identity.name}</h3>
          <div className={styles.titleActions}>
            <Link
              className={styles.editInlineButton}
              href={`/rpg/${character.meta.version}/characters`}
            >
              Voltar
            </Link>
            <Link
              className={styles.editInlineButton}
              href={`/rpg/${character.meta.version}/characters/novo?characterId=${character.id}`}
            >
              Editar
            </Link>
          </div>
        </div>
        <div className={styles.header}>
          <div className={styles.imageColumn}>
            <Image
              src={character.image}
              alt={character.identity.name}
              width={150}
              height={192}
              priority
            />
            <Link
              className={`${styles.actionLink} ${styles.imageActionLink}`}
              href={`/rpg/${character.meta.version}/characters/${character.id}/inventory`}
            >
              Inventario
            </Link>
          </div>
          <div className={styles.identityInfo}>
            {character.identity.nickname && (
              <p className={styles.nickname}>
                &quot;{character.identity.nickname}&quot;
              </p>
            )}

            <div className={styles.actionLinks}>
              <Link
                className={styles.actionLink}
                href={`/rpg/${character.meta.version}/characters/${character.id}/abilities`}
              >
                Habilidades
              </Link>
              <Link
                className={styles.actionLink}
                href={`/rpg/${character.meta.version}/characters/${character.id}/magics`}
              >
                Magias
              </Link>
              <Link
                className={styles.actionLink}
                href={`/rpg/${character.meta.version}/characters/${character.id}/magics`}
              >
                Armas
              </Link>
            </div>

            <p className={styles.kingdom}>Reino: {character.identity.kingdom}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <div>
            <h4>Status</h4>
            <p>
              Vida: {character.state.currentLife}/{character.health.life}
            </p>
            <p>
              Mana: {character.state.currentMana}/{character.health.mana}
            </p>
            <p>
              Sanidade: {character.state.currentSanity}/{character.health.sanity}
            </p>
            <p>
              Exaustao: {character.state.currentExhaustion}/{character.health.exhaustion}
            </p>
          </div>

          <div>
            <h4>Defesa</h4>
            <p>Base: {character.defense.base}</p>
            <p>Armadura: {character.defense.armor}</p>
            <p>Escudo: {character.defense.shield}</p>
            <p>Evasao: {character.defense.evasion}</p>
          </div>

          <div>
            <h4>Progressao</h4>
            <p>Nivel: {character.progression.level}</p>
            <p>XP: {character.progression.xp}</p>
            <p>Proximo nivel: {character.progression.xpToNextLevel}</p>
          </div>
        </div>

        <div className={styles.containerSkillAttributes}>
          <div>
            <h4>Atributos</h4>
            <ul className={styles.list}>
              <li>Agilidade: {character.attributes.agility.total}</li>
              <li>Forca: {character.attributes.strength.total}</li>
              <li>Destreza: {character.attributes.dexterity.total}</li>
              <li>Instinto: {character.attributes.instinct.total}</li>
              <li>Carisma: {character.attributes.charisma.total}</li>
              <li>Conhecimento: {character.attributes.knowledge.total}</li>
              <li>Constituicao: {character.attributes.constitution.total}</li>
            </ul>
          </div>
          <div>
            <h4>Pericias</h4>
            <ul className={styles.list}>
              {Object.entries(character.skills)
                .filter(([, value]) => value > 0)
                .map(([key, value]) => (
                  <li key={key}>
                    {skillLabels[key] ?? key}: {value}
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className={styles.grid}>
          <div>
            <h4>Fisico</h4>
            <p>Idade: {character.physical.age}</p>
            <p>Altura: {character.physical.heightCm}cm</p>
            <p>Peso: {character.physical.weightKg}kg</p>
            <p>Olhos: {character.physical.eyes}</p>
            <p>Pele: {character.physical.skin}</p>
            <p>Cabelo: {character.physical.hair}</p>
            <p>{character.physical.other}</p>
          </div>

          <div>
            <h4>Pessoal</h4>
            <p>Reino: {character.identity.kingdom}</p>
            <p>Religiao: {character.personal.religion}</p>
            <p>Lingua: {character.personal.language}</p>
            <p>Defeitos: {character.personal.defects}</p>
            <p>
              Raca:{" "}
              <Link
                className={styles.identityLink}
                href={`/rpg/${character.meta.version}/races/${character.identity.race}`}
              >
                {character.identity.race}
              </Link>
            </p>
            <p>
              Classe:{" "}
              <Link
                className={styles.identityLink}
                href={`/rpg/${character.meta.version}/classes/${character.identity.class}`}
              >
                {character.identity.class}
              </Link>
            </p>
            {character.identity.classReinforcement && (
              <p>Reforco de Classe: {character.identity.classReinforcement}</p>
            )}
          </div>

          <div>
            <h4>Ancestralidade</h4>
            <p>{character.ancestry.description}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <div>
            <h4>Equipamentos</h4>
            <p>Armas: {character.equipment.weaponIds.join(", ") || "-"}</p>
            <p>Escudo: {character.equipment.shieldId ?? "-"}</p>
            <p>Armadura: {character.equipment.armorId ?? "-"}</p>
          </div>

          <div>
            <h4>Meta</h4>
            <p>NPC: {character.meta.isNPC ? "Sim" : "Nao"}</p>
            <p>Editavel: {character.meta.isEditable ? "Sim" : "Nao"}</p>
            <p>Versao: {character.meta.version}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
