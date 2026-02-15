import Image from "next/image"
import styles from "./page.module.css"
import players from "@/data/rpg/world-of-clans/entities/player"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../../../generated/prisma/client"
import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { formatDateInBrasilia } from "@/lib/date"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

type DbCharacterRow = {
  id: string
  name: string
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
  attributes: Prisma.JsonValue
  skills: Prisma.JsonValue
  createdAt: Date
}

type MemberStatusRow = {
  status: "pending" | "accepted" | "rejected"
}

type SkillTemplateLabelRow = {
  key: string
  label: string
}

async function getUserIdFromCookie() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
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
export default async function CharactersPage({ params }: Params) {
  const { rpgId, characterId } = await params
  const character = players.find((p) => p.id === characterId)

  if (!character) {
    let dbCharacter: DbCharacterRow[] = []
    let skillLabelByKey = new Map<string, string>()
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

      userId = await getUserIdFromCookie()
      isOwner = userId === dbRpg.ownerId
      let isAcceptedMember = false

      if (userId && !isOwner) {
        const membership = await prisma.$queryRaw<MemberStatusRow[]>(Prisma.sql`
          SELECT status
          FROM rpg_members
          WHERE rpg_id = ${rpgId}
            AND user_id = ${userId}
          LIMIT 1
        `)

        isAcceptedMember = membership[0]?.status === "accepted"
      }

      if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
        notFound()
      }

      dbCharacter = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
        SELECT
          id,
          name,
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
          attributes,
          skills,
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
    } catch {
      dbCharacter = []
      skillLabelByKey = new Map()
    }

    if (dbCharacter.length === 0) {
      notFound()
    }

    const row = dbCharacter[0]

    if (
      row.visibility === "private" &&
      !isOwner &&
      (!userId || row.createdByUserId !== userId)
    ) {
      notFound()
    }

    const attributes = row.attributes as Record<string, number>
    const statuses = row.statuses as Record<string, number>
    const skills = row.skills as Record<string, number>

    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h3>{row.name}</h3>

          <div className={styles.grid}>
            <div>
              <h4>Ficha Basica</h4>
              <p>ID: {row.id}</p>
              <p>
                Tipo:{" "}
                {row.characterType === "player"
                  ? "Player"
                  : row.characterType === "npc"
                    ? "NPC"
                    : "Monstro"}
              </p>
              {row.raceKey ? <p>Raca: {row.raceKey}</p> : null}
              {row.classKey ? <p>Classe: {row.classKey}</p> : null}
              <p>Criado em: {formatDateInBrasilia(row.createdAt)}</p>
            </div>

            <div>
              <h4>Status</h4>
              <ul className={styles.list}>
                {Object.entries(statuses).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Atributos do Padrao</h4>
              <ul className={styles.list}>
                {Object.entries(attributes).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Pericias do Padrao</h4>
              <ul className={styles.list}>
                {Object.entries(skills).map(([key, value]) => (
                  <li key={key}>
                    {skillLabelByKey.get(key) ?? key}: {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.actionLinks}>
            <Link
              className={styles.actionLink}
              href={`/rpg/${rpgId}/characters/${characterId}/inventory`}
            >
              Inventario
            </Link>
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
        <h3>{character.identity.name}</h3>
        <div className={styles.header}>
          <Image
            src={character.image}
            alt={character.identity.name}
            width={150}
            height={192}
            priority
          />
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
              <Link
                className={styles.actionLink}
                href={`/rpg/${character.meta.version}/characters/${character.id}/inventory`}
              >
                Inventario
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
