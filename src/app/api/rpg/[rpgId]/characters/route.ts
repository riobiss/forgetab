import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import {
  ATTRIBUTE_CATALOG,
  DEFAULT_ATTRIBUTE_KEYS,
} from "@/lib/rpg/attributeCatalog"
import {
  DEFAULT_STATUS_KEYS,
  STATUS_CATALOG,
} from "@/lib/rpg/statusCatalog"
import { addBonusToBase } from "@/lib/rpg/classRaceBonuses"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type CharacterRow = {
  id: string
  rpgId: string
  name: string
  image: string | null
  raceKey: string | null
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  maxCarryWeight: number | null
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
  updatedAt: Date
}

type AttributeTemplateRow = {
  key: string
  label: string
  position: number
}

type StatusTemplateRow = {
  key: string
  label: string
  position: number
}

type SkillTemplateRow = {
  key: string
  label: string
  position: number
}

type CharacterIdentityTemplateRow = {
  key: string
  label: string
  required: boolean
  position: number
}

type CharacterCharacteristicTemplateRow = {
  key: string
  label: string
  required: boolean
  position: number
}

type IdentityTemplateRow = {
  key: string
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
}

type CharacterCreationRequestRow = {
  status: "pending" | "accepted" | "rejected"
}

async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

type RpgAccess = {
  exists: boolean
  canAccess: boolean
  isOwner: boolean
  useClassRaceBonuses: boolean
  useInventoryWeightLimit: boolean
}

async function getRpgAccess(rpgId: string, userId: string): Promise<RpgAccess> {
  let rows: Array<{
    ownerId: string
    useClassRaceBonuses: boolean
    useInventoryWeightLimit: boolean
  }> = []
  try {
    rows = await prisma.$queryRaw<
      Array<{
        ownerId: string
        useClassRaceBonuses: boolean
        useInventoryWeightLimit: boolean
      }>
    >(
      Prisma.sql`
        SELECT
          owner_id AS "ownerId",
          COALESCE(use_class_race_bonuses, false) AS "useClassRaceBonuses",
          COALESCE(use_inventory_weight_limit, false) AS "useInventoryWeightLimit"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `,
    )
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "use_class_race_bonuses" does not exist') ||
        error.message.includes('column "use_inventory_weight_limit" does not exist'))
    ) {
      rows = await prisma.$queryRaw<
        Array<{
          ownerId: string
          useClassRaceBonuses: boolean
          useInventoryWeightLimit: boolean
        }>
      >(
        Prisma.sql`
          SELECT
            owner_id AS "ownerId",
            false AS "useClassRaceBonuses",
            false AS "useInventoryWeightLimit"
          FROM rpgs
          WHERE id = ${rpgId}
          LIMIT 1
        `,
      )
    } else {
      throw error
    }
  }
  const rpg = rows[0]

  if (!rpg) {
    return {
      exists: false,
      canAccess: false,
      isOwner: false,
      useClassRaceBonuses: false,
      useInventoryWeightLimit: false,
    }
  }

  if (rpg.ownerId === userId) {
    return {
      exists: true,
      canAccess: true,
      isOwner: true,
      useClassRaceBonuses: rpg.useClassRaceBonuses,
      useInventoryWeightLimit: rpg.useInventoryWeightLimit,
    }
  }

  const membership = await prisma.rpgMember.findUnique({
    where: {
      rpgId_userId: {
        rpgId,
        userId,
      },
    },
    select: { status: true },
  })

  return {
    exists: true,
    canAccess: membership?.status === "accepted",
    isOwner: false,
    useClassRaceBonuses: rpg.useClassRaceBonuses,
    useInventoryWeightLimit: rpg.useInventoryWeightLimit,
  }
}

function validateAttributesPayload(
  incoming: unknown,
  template: AttributeTemplateRow[],
) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Atributos invalidos." }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Atributo obrigatorio ausente: ${key}.` }
    }

    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { ok: false as const, message: `Valor invalido para atributo ${key}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Atributo fora do padrao: ${extraKey}.` }
  }

  return { ok: true as const, value: record }
}

function validateStatusesPayload(
  incoming: unknown,
  template: StatusTemplateRow[],
) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Status invalidos." }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Status obrigatorio ausente: ${key}.` }
    }

    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      return { ok: false as const, message: `Valor invalido para status ${key}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Status fora do padrao: ${extraKey}.` }
  }

  return { ok: true as const, value: record as Record<string, number> }
}

function validateSkillsPayload(
  incoming: unknown,
  template: SkillTemplateRow[],
) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Pericias invalidas." }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Pericia obrigatoria ausente: ${key}.` }
    }

    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      return { ok: false as const, message: `Valor invalido para pericia ${key}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Pericia fora do padrao: ${extraKey}.` }
  }

  const normalized = allowedKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = Math.floor(Number(record[key]))
    return acc
  }, {})

  return { ok: true as const, value: normalized }
}

function validateIdentityPayload(
  incoming: unknown,
  template: CharacterIdentityTemplateRow[],
) {
  if (template.length === 0) {
    return { ok: true as const, value: {} as Record<string, string> }
  }

  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Identidade invalida." }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const item of template) {
    const raw = record[item.key]
    const value = typeof raw === "string" ? raw.trim() : ""
    if (item.required && value.length === 0) {
      return { ok: false as const, message: `Campo obrigatorio ausente: ${item.label}.` }
    }
    if (raw !== undefined && typeof raw !== "string") {
      return { ok: false as const, message: `Valor invalido para ${item.label}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Campo de identidade fora do padrao: ${extraKey}.` }
  }

  const normalized = template.reduce<Record<string, string>>((acc, item) => {
    const value = record[item.key]
    acc[item.key] = typeof value === "string" ? value.trim() : ""
    return acc
  }, {})

  return { ok: true as const, value: normalized }
}

function validateCharacteristicsPayload(
  incoming: unknown,
  template: CharacterCharacteristicTemplateRow[],
) {
  if (template.length === 0) {
    return { ok: true as const, value: {} as Record<string, string> }
  }

  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Caracteristicas invalidas." }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const item of template) {
    const raw = record[item.key]
    const value = typeof raw === "string" ? raw.trim() : ""
    if (item.required && value.length === 0) {
      return { ok: false as const, message: `Campo obrigatorio ausente: ${item.label}.` }
    }
    if (raw !== undefined && typeof raw !== "string") {
      return { ok: false as const, message: `Valor invalido para ${item.label}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Campo de caracteristica fora do padrao: ${extraKey}.` }
  }

  const normalized = template.reduce<Record<string, string>>((acc, item) => {
    const value = record[item.key]
    acc[item.key] = typeof value === "string" ? value.trim() : ""
    return acc
  }, {})

  return { ok: true as const, value: normalized }
}

function isValidCharacterType(value: unknown): value is CharacterRow["characterType"] {
  return value === "player" || value === "npc" || value === "monster"
}

function validateStat(name: string, value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: `Valor invalido para ${name}.` }
  }

  return { ok: true as const, value: Math.floor(value) }
}

function validateMaxCarryWeight(value: unknown) {
  if (value === null || value === undefined) {
    return { ok: true as const, value: null as number | null }
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: "Peso maximo invalido." }
  }

  return { ok: true as const, value }
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getDefaultAttributeTemplate(): AttributeTemplateRow[] {
  return ATTRIBUTE_CATALOG.filter((item) =>
    DEFAULT_ATTRIBUTE_KEYS.includes(item.key),
  ).map((item, index) => ({
    key: item.key,
    label: item.label,
    position: index,
  }))
}

function getDefaultStatusTemplate(): StatusTemplateRow[] {
  return STATUS_CATALOG.filter((item) => DEFAULT_STATUS_KEYS.includes(item.key)).map(
    (item, index) => ({
      key: item.key,
      label: item.label,
      position: index,
    }),
  )
}

function parseJsonBonusRecord(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (acc, [key, current]) => {
      if (typeof current === "number" && Number.isFinite(current)) {
        acc[key] = Math.floor(current)
      }
      return acc
    },
    {},
  )
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    let characters: CharacterRow[] = []
    try {
      characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
        SELECT
          id,
          rpg_id AS "rpgId",
          name,
          image,
          race_key AS "raceKey",
          class_key AS "classKey",
          character_type AS "characterType",
          visibility,
          max_carry_weight AS "maxCarryWeight",
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
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          ${
            access.isOwner
              ? Prisma.empty
              : userId
                ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
                : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
          }
        ORDER BY created_at DESC
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "race_key" does not exist') ||
          error.message.includes('column "class_key" does not exist') ||
          error.message.includes('column "max_carry_weight" does not exist') ||
          error.message.includes('column "current_statuses" does not exist') ||
          error.message.includes('column "identity" does not exist') ||
          error.message.includes('column "characteristics" does not exist'))
      ) {
        characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
          SELECT
            id,
            rpg_id AS "rpgId",
            name,
            null::text AS "image",
            null::text AS "raceKey",
            null::text AS "classKey",
            character_type AS "characterType",
            visibility,
            null::double precision AS "maxCarryWeight",
            created_by_user_id AS "createdByUserId",
            life,
            defense,
            mana,
            stamina,
            sanity,
            statuses,
            '{}'::jsonb AS "currentStatuses",
            attributes,
            skills,
            '{}'::jsonb AS identity,
            '{}'::jsonb AS characteristics,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM rpg_characters
          WHERE rpg_id = ${rpgId}
            ${
              access.isOwner
                ? Prisma.empty
                : userId
                  ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
                  : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
            }
          ORDER BY created_at DESC
        `)
      } else {
        throw error
      }
    }

    return NextResponse.json(
      {
        characters,
        isOwner: access.isOwner,
        useClassRaceBonuses: access.useClassRaceBonuses,
        useInventoryWeightLimit: access.useInventoryWeightLimit,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao listar personagens." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = (await request.json()) as {
      name?: string
      image?: string
      characterType?: CharacterRow["characterType"]
      maxCarryWeight?: number | null
      statuses?: Record<string, number>
      attributes?: Record<string, number>
      skills?: Record<string, number>
      identity?: Record<string, string>
      characteristics?: Record<string, string>
      raceKey?: string
      classKey?: string
    }

    const name = body.name?.trim() ?? ""
    const image = normalizeOptionalText(body.image)
    if (name.length < 2) {
      return NextResponse.json(
        { message: "Nome deve ter pelo menos 2 caracteres." },
        { status: 400 },
      )
    }

    if (!isValidCharacterType(body.characterType)) {
      return NextResponse.json(
        { message: "Tipo invalido. Use player, npc ou monster." },
        { status: 400 },
      )
    }

    if (!access.isOwner && body.characterType !== "player") {
      return NextResponse.json(
        { message: "Somente personagens do tipo player podem ser criados por jogadores." },
        { status: 400 },
      )
    }

    const parsedMaxCarryWeight = validateMaxCarryWeight(body.maxCarryWeight)
    if (!parsedMaxCarryWeight.ok) {
      return NextResponse.json({ message: parsedMaxCarryWeight.message }, { status: 400 })
    }
    if (
      access.useInventoryWeightLimit &&
      body.characterType === "player" &&
      parsedMaxCarryWeight.value === null
    ) {
      return NextResponse.json(
        { message: "Peso maximo e obrigatorio para player neste RPG." },
        { status: 400 },
      )
    }
    const maxCarryWeight =
      access.useInventoryWeightLimit && body.characterType === "player"
        ? parsedMaxCarryWeight.value
        : null

    if (!access.isOwner && body.skills !== undefined) {
      return NextResponse.json(
        { message: "Somente o owner do RPG pode definir pericias." },
        { status: 403 },
      )
    }

    if (!access.isOwner) {
      const creationRequest = await prisma.$queryRaw<CharacterCreationRequestRow[]>(Prisma.sql`
        SELECT status
        FROM rpg_character_creation_requests
        WHERE rpg_id = ${rpgId}
          AND user_id = ${userId}
        LIMIT 1
      `)

      if (creationRequest[0]?.status !== "accepted") {
        return NextResponse.json(
          {
            message:
              "Voce precisa da permissao do mestre para criar personagem. Envie uma solicitacao.",
          },
          { status: 403 },
        )
      }
    }

    if (!access.isOwner) {
      const existingPlayer = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          AND character_type = 'player'::"RpgCharacterType"
          AND created_by_user_id = ${userId}
        LIMIT 1
      `)

      if (existingPlayer.length > 0) {
        return NextResponse.json(
          { message: "Voce ja possui um personagem player neste RPG." },
          { status: 409 },
        )
      }
    }

    let dbAttributeTemplate: AttributeTemplateRow[] = []
    try {
      dbAttributeTemplate = await prisma.$queryRaw<AttributeTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_attribute_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('relation "rpg_attribute_templates" does not exist'))) {
        throw error
      }
    }
    const template =
      dbAttributeTemplate.length > 0 ? dbAttributeTemplate : getDefaultAttributeTemplate()

    const parsedAttributes = validateAttributesPayload(body.attributes, template)
    if (!parsedAttributes.ok) {
      return NextResponse.json({ message: parsedAttributes.message }, { status: 400 })
    }

    let dbStatusTemplate: StatusTemplateRow[] = []
    try {
      dbStatusTemplate = await prisma.$queryRaw<StatusTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_status_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('relation "rpg_status_templates" does not exist'))) {
        throw error
      }
    }
    const statusTemplate =
      dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()

    const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
    if (!parsedStatuses.ok) {
      return NextResponse.json({ message: parsedStatuses.message }, { status: 400 })
    }

    const life = validateStat("vida", parsedStatuses.value.life ?? 0)
    if (!life.ok) return NextResponse.json({ message: life.message }, { status: 400 })

    const defense = validateStat("defesa", parsedStatuses.value.defense ?? 0)
    if (!defense.ok) {
      return NextResponse.json({ message: defense.message }, { status: 400 })
    }

    const mana = validateStat("mana", parsedStatuses.value.mana ?? 0)
    if (!mana.ok) return NextResponse.json({ message: mana.message }, { status: 400 })

    const stamina = validateStat("estamina", parsedStatuses.value.stamina ?? 0)
    if (!stamina.ok) {
      return NextResponse.json({ message: stamina.message }, { status: 400 })
    }

    const sanity = validateStat("sanidade", parsedStatuses.value.sanity ?? 0)
    if (!sanity.ok) {
      return NextResponse.json({ message: sanity.message }, { status: 400 })
    }

    let dbSkillTemplate: SkillTemplateRow[] = []
    try {
      dbSkillTemplate = await prisma.$queryRaw<SkillTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_skill_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('relation "rpg_skill_templates" does not exist'))) {
        throw error
      }
    }
    const skillTemplate = dbSkillTemplate

    const defaultSkills = skillTemplate.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = 0
      return acc
    }, {})
    const incomingSkills = access.isOwner ? body.skills ?? defaultSkills : defaultSkills
    const parsedSkills = validateSkillsPayload(incomingSkills, skillTemplate)
    if (!parsedSkills.ok) {
      return NextResponse.json({ message: parsedSkills.message }, { status: 400 })
    }

    let identityTemplate: CharacterIdentityTemplateRow[] = []
    try {
      identityTemplate = await prisma.$queryRaw<CharacterIdentityTemplateRow[]>(Prisma.sql`
        SELECT key, label, required, position
        FROM rpg_character_identity_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        !(error instanceof Error && error.message.includes('relation "rpg_character_identity_templates" does not exist'))
      ) {
        throw error
      }
    }

    const parsedIdentity = validateIdentityPayload(body.identity, identityTemplate)
    if (!parsedIdentity.ok) {
      return NextResponse.json({ message: parsedIdentity.message }, { status: 400 })
    }

    let characteristicsTemplate: CharacterCharacteristicTemplateRow[] = []
    try {
      characteristicsTemplate = await prisma.$queryRaw<CharacterCharacteristicTemplateRow[]>(Prisma.sql`
        SELECT key, label, required, position
        FROM rpg_character_characteristic_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        !(error instanceof Error && error.message.includes('relation "rpg_character_characteristic_templates" does not exist'))
      ) {
        throw error
      }
    }

    const parsedCharacteristics = validateCharacteristicsPayload(
      body.characteristics,
      characteristicsTemplate,
    )
    if (!parsedCharacteristics.ok) {
      return NextResponse.json({ message: parsedCharacteristics.message }, { status: 400 })
    }

    let selectedRaceKey: string | null = null
    let selectedClassKey: string | null = null
    let raceAttributeBonuses: Record<string, number> = {}
    let classAttributeBonuses: Record<string, number> = {}
    let raceSkillBonuses: Record<string, number> = {}
    let classSkillBonuses: Record<string, number> = {}

    if (access.useClassRaceBonuses) {
      selectedRaceKey = body.raceKey?.trim() || null
      selectedClassKey = body.classKey?.trim() || null

      let raceTemplates: IdentityTemplateRow[] = []
      let classTemplates: IdentityTemplateRow[] = []
      try {
        raceTemplates = await prisma.$queryRaw<IdentityTemplateRow[]>(Prisma.sql`
          SELECT key, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
          FROM rpg_race_templates
          WHERE rpg_id = ${rpgId}
        `)
        classTemplates = await prisma.$queryRaw<IdentityTemplateRow[]>(Prisma.sql`
          SELECT key, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
          FROM rpg_class_templates
          WHERE rpg_id = ${rpgId}
        `)
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes('relation "rpg_race_templates" does not exist') ||
            error.message.includes('relation "rpg_class_templates" does not exist'))
        ) {
          return NextResponse.json(
            { message: "Estrutura de racas/classes nao existe no banco. Rode a migration." },
            { status: 500 },
          )
        }
        throw error
      }

      if (selectedRaceKey) {
        const race = raceTemplates.find((item) => item.key === selectedRaceKey)
        if (!race) {
          return NextResponse.json({ message: "Raca invalida para este RPG." }, { status: 400 })
        }
        raceAttributeBonuses = parseJsonBonusRecord(race.attributeBonuses)
        raceSkillBonuses = parseJsonBonusRecord(race.skillBonuses)
      }

      if (selectedClassKey) {
        const cls = classTemplates.find((item) => item.key === selectedClassKey)
        if (!cls) {
          return NextResponse.json({ message: "Classe invalida para este RPG." }, { status: 400 })
        }
        classAttributeBonuses = parseJsonBonusRecord(cls.attributeBonuses)
        classSkillBonuses = parseJsonBonusRecord(cls.skillBonuses)
      }
    }

    const finalAttributes = addBonusToBase(
      parsedAttributes.value as Record<string, number>,
      raceAttributeBonuses,
      classAttributeBonuses,
    )
    const finalSkills = addBonusToBase(
      parsedSkills.value,
      raceSkillBonuses,
      classSkillBonuses,
    )

    const createdByUserId = access.isOwner ? null : userId

    const created = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      INSERT INTO rpg_characters (
        id, rpg_id, name, image, race_key, class_key, character_type, visibility, max_carry_weight, created_by_user_id, life, defense, mana, stamina, sanity, statuses, current_statuses, attributes, skills, identity, characteristics
      )
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${name},
        ${image},
        ${selectedRaceKey},
        ${selectedClassKey},
        ${body.characterType}::"RpgCharacterType",
        'public'::"RpgVisibility",
        ${maxCarryWeight},
        ${createdByUserId},
        ${life.value},
        ${defense.value},
        ${mana.value},
        ${stamina.value},
        ${sanity.value},
        ${JSON.stringify(parsedStatuses.value)}::jsonb,
        ${JSON.stringify(parsedStatuses.value)}::jsonb,
        ${JSON.stringify(finalAttributes)}::jsonb,
        ${JSON.stringify(finalSkills)}::jsonb,
        ${JSON.stringify(parsedIdentity.value)}::jsonb,
        ${JSON.stringify(parsedCharacteristics.value)}::jsonb
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        image,
        race_key AS "raceKey",
        class_key AS "classKey",
        character_type AS "characterType",
        visibility,
        max_carry_weight AS "maxCarryWeight",
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
        identity,
        characteristics,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return NextResponse.json({ character: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_creation_requests" does not exist')
    ) {
      return NextResponse.json(
        {
          message:
            "Tabela de solicitacoes de criacao de personagem nao existe no banco. Rode a migration.",
        },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "created_by_user_id" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "visibility" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "race_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "class_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "max_carry_weight" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "current_statuses" of relation "rpg_characters" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('column "use_inventory_weight_limit" does not exist')
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "identity" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "characteristics" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_identity_templates" does not exist')
    ) {
      return NextResponse.json(
        { message: "Tabela de identidade de personagem nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_characteristic_templates" does not exist')
    ) {
      return NextResponse.json(
        { message: "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao criar personagem." },
      { status: 500 },
    )
  }
}
