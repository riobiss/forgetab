import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import {
  DEFAULT_STATUS_KEYS,
  STATUS_CATALOG,
} from "@/lib/rpg/statusCatalog"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
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

function normalizeStatusKey(key: string) {
  return key === "stamina" ? "exhaustion" : key
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

function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  if (!privateKey || !urlEndpoint) {
    return { ok: false as const }
  }

  return { ok: true as const, privateKey, urlEndpoint }
}

function buildCharacterFolder(userId: string) {
  return `/forgetab/users/${userId}/characters`
}

function parseHost(value: string) {
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

function normalizeUrlPath(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return null
  }
}

function extractFileNameFromUrl(value: string) {
  const path = normalizeUrlPath(value)
  if (!path) return null

  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return null

  return parts[parts.length - 1]
}

async function deleteImageKitFileByUrl(
  privateKey: string,
  urlEndpoint: string,
  rawUrl: string | null,
  allowedFolderPaths: string[],
) {
  if (!rawUrl) return

  const imageUrl = rawUrl.trim()
  if (!imageUrl) return

  const endpointHost = parseHost(urlEndpoint)
  const imageUrlHost = parseHost(imageUrl)
  if (!endpointHost || !imageUrlHost || endpointHost !== imageUrlHost) {
    return
  }

  const normalizedImagePath = normalizeUrlPath(imageUrl)
  const allowedPrefixes = allowedFolderPaths
    .map((folder) => folder.trim())
    .filter((folder) => folder.length > 0)
    .map((folder) => (folder.endsWith("/") ? folder : `${folder}/`))

  if (
    !normalizedImagePath ||
    allowedPrefixes.length === 0 ||
    !allowedPrefixes.some((prefix) => normalizedImagePath.startsWith(prefix))
  ) {
    return
  }

  const fileName = extractFileNameFromUrl(imageUrl)
  if (!fileName) return

  const auth = Buffer.from(`${privateKey}:`, "utf8").toString("base64")
  const escapedFileName = fileName.replace(/"/g, '\\"')
  const searchQuery = encodeURIComponent(`name = "${escapedFileName}"`)
  const listResponse = await fetch(
    `https://api.imagekit.io/v1/files?limit=100&searchQuery=${searchQuery}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  )

  if (!listResponse.ok) {
    throw new Error("Falha ao listar imagem no ImageKit.")
  }

  const listPayload = (await listResponse.json()) as Array<{
    fileId?: string
    url?: string
  }>

  const target = listPayload.find((item) => {
    if (!item.fileId || !item.url) return false
    if (item.url === imageUrl) return true

    const itemPath = normalizeUrlPath(item.url)
    return Boolean(
      normalizedImagePath &&
        itemPath &&
        itemPath === normalizedImagePath &&
        allowedPrefixes.some((prefix) => itemPath.startsWith(prefix)),
    )
  })

  if (!target?.fileId) return

  const deleteResponse = await fetch(`https://api.imagekit.io/v1/files/${target.fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    throw new Error("Falha ao remover imagem no ImageKit.")
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

  const sourceRecord = incoming as Record<string, unknown>
  const record = Object.entries(sourceRecord).reduce<Record<string, unknown>>(
    (acc, [rawKey, value]) => {
      acc[normalizeStatusKey(rawKey)] = value
      return acc
    },
    {},
  )
  const allowedKeys = template.map((item) => normalizeStatusKey(item.key))

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

function isValidVisibility(value: unknown): value is "private" | "public" {
  return value === "private" || value === "public"
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

async function canManageCharacter(rpgId: string, characterId: string, userId: string) {
  let rpgRows: Array<{
    id: string
    ownerId: string
    useInventoryWeightLimit: boolean
  }> = []
  try {
    rpgRows = await prisma.$queryRaw<
      Array<{
        id: string
        ownerId: string
        useInventoryWeightLimit: boolean
      }>
    >(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        COALESCE(use_inventory_weight_limit, false) AS "useInventoryWeightLimit"
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('column "use_inventory_weight_limit" does not exist')
    ) {
      throw error
    }

    rpgRows = await prisma.$queryRaw<
      Array<{
        id: string
        ownerId: string
        useInventoryWeightLimit: boolean
      }>
    >(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        false AS "useInventoryWeightLimit"
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
  }
  const rpg = rpgRows[0]

  if (!rpg) {
    return { ok: false as const, status: 404, message: "RPG nao encontrado." }
  }

  const isOwner = rpg.ownerId === userId
  let isModerator = false

  if (!isOwner) {
    const membership = await prisma.$queryRaw<Array<{ status: string; role: string }>>(Prisma.sql`
      SELECT status::text AS status, role::text AS role
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    if (membership[0]?.status !== "accepted") {
      return { ok: false as const, status: 404, message: "RPG nao encontrado." }
    }

    isModerator = membership[0]?.role === "moderator"
  }

  const canManageAsMaster = isOwner || isModerator

  let character: Array<{
    id: string
    characterType: "player" | "npc" | "monster"
    createdByUserId: string | null
    skills: Prisma.JsonValue
    currentStatuses: Prisma.JsonValue
    identity: Prisma.JsonValue
    characteristics: Prisma.JsonValue
  }> = []
  try {
    character = await prisma.$queryRaw<
      Array<{
        id: string
        characterType: "player" | "npc" | "monster"
        createdByUserId: string | null
        skills: Prisma.JsonValue
        currentStatuses: Prisma.JsonValue
        identity: Prisma.JsonValue
        characteristics: Prisma.JsonValue
      }>
    >(Prisma.sql`
      SELECT
        id,
        character_type AS "characterType",
        created_by_user_id AS "createdByUserId",
        skills,
        COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses",
        COALESCE(identity, '{}'::jsonb) AS identity,
        COALESCE(characteristics, '{}'::jsonb) AS characteristics
      FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (!error.message.includes('column "identity" does not exist') &&
        !error.message.includes('column "characteristics" does not exist') &&
        !error.message.includes('column "current_statuses" does not exist'))
    ) {
      throw error
    }

    character = await prisma.$queryRaw<
      Array<{
        id: string
        characterType: "player" | "npc" | "monster"
        createdByUserId: string | null
        skills: Prisma.JsonValue
        currentStatuses: Prisma.JsonValue
        identity: Prisma.JsonValue
        characteristics: Prisma.JsonValue
      }>
    >(Prisma.sql`
      SELECT
        id,
        character_type AS "characterType",
        created_by_user_id AS "createdByUserId",
        skills,
        '{}'::jsonb AS "currentStatuses",
        '{}'::jsonb AS identity,
        '{}'::jsonb AS characteristics
      FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
  }

  if (character.length === 0) {
    return { ok: false as const, status: 404, message: "Personagem nao encontrado." }
  }

  if (!canManageAsMaster && character[0].createdByUserId !== userId) {
    return { ok: false as const, status: 403, message: "Sem permissao para editar este personagem." }
  }

  return {
    ok: true as const,
    isOwner: canManageAsMaster,
    rpgOwnerId: rpg.ownerId,
    characterCreatedByUserId: character[0].createdByUserId,
    useInventoryWeightLimit: rpg.useInventoryWeightLimit,
    characterType: character[0].characterType,
    currentSkills: character[0].skills,
    currentCurrentStatuses: character[0].currentStatuses,
    currentIdentity: character[0].identity,
    currentCharacteristics: character[0].characteristics,
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const permission = await canManageCharacter(rpgId, characterId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const body = (await request.json()) as {
      name?: string
      image?: string
      maxCarryWeight?: number | null
      statuses?: Record<string, number>
      attributes?: Record<string, number>
      skills?: Record<string, number>
      identity?: Record<string, string>
      characteristics?: Record<string, string>
      visibility?: "private" | "public"
      raceKey?: string
      classKey?: string
    }

    if (body.raceKey !== undefined || body.classKey !== undefined) {
      return NextResponse.json(
        { message: "Raca e classe so podem ser definidas na criacao do personagem." },
        { status: 400 },
      )
    }

    const name = body.name?.trim() ?? ""
    const hasImageInBody = Object.prototype.hasOwnProperty.call(body, "image")
    const image = normalizeOptionalText(body.image)
    let previousImage: string | null = null
    if (name.length < 2) {
      return NextResponse.json(
        { message: "Nome deve ter pelo menos 2 caracteres." },
        { status: 400 },
      )
    }

    if (body.visibility !== undefined && !isValidVisibility(body.visibility)) {
      return NextResponse.json(
        { message: "Visibilidade invalida. Use private ou public." },
        { status: 400 },
      )
    }

    const visibility = body.visibility ?? null
    const hasMaxCarryWeightInBody = Object.prototype.hasOwnProperty.call(
      body,
      "maxCarryWeight",
    )
    const parsedMaxCarryWeight = validateMaxCarryWeight(body.maxCarryWeight)
    if (!parsedMaxCarryWeight.ok) {
      return NextResponse.json({ message: parsedMaxCarryWeight.message }, { status: 400 })
    }
    const resolvedMaxCarryWeight =
      permission.useInventoryWeightLimit && permission.characterType === "player"
        ? parsedMaxCarryWeight.value
        : null

    if (hasImageInBody) {
      const currentRows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
        SELECT image
        FROM rpg_characters
        WHERE id = ${characterId}
          AND rpg_id = ${rpgId}
        LIMIT 1
      `)
      previousImage = currentRows[0]?.image ?? null
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
      if (
        !(
          error instanceof Error &&
          error.message.includes('relation "rpg_attribute_templates" does not exist')
        )
      ) {
        throw error
      }
    }
    const template = dbAttributeTemplate

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
      if (
        !(
          error instanceof Error &&
          error.message.includes('relation "rpg_status_templates" does not exist')
        )
      ) {
        throw error
      }
    }
    const statusTemplate =
      dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()

    const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
    if (!parsedStatuses.ok) {
      return NextResponse.json({ message: parsedStatuses.message }, { status: 400 })
    }
    const currentStatusesRecord =
      permission.currentCurrentStatuses &&
      typeof permission.currentCurrentStatuses === "object" &&
      !Array.isArray(permission.currentCurrentStatuses)
        ? (permission.currentCurrentStatuses as Record<string, unknown>)
        : {}
    const normalizedCurrentStatuses = Object.entries(parsedStatuses.value).reduce<
      Record<string, number>
    >((acc, [key, maxValue]) => {
      const rawCurrent = currentStatusesRecord[key]
      const currentNumber =
        typeof rawCurrent === "number" && Number.isFinite(rawCurrent)
          ? Math.floor(rawCurrent)
          : Math.floor(maxValue)
      acc[key] = Math.max(0, Math.min(Math.floor(maxValue), currentNumber))
      return acc
    }, {})

    const life = validateStat("vida", parsedStatuses.value.life ?? 0)
    if (!life.ok) return NextResponse.json({ message: life.message }, { status: 400 })

    const defense = validateStat("defesa", parsedStatuses.value.defense ?? 0)
    if (!defense.ok) return NextResponse.json({ message: defense.message }, { status: 400 })

    const mana = validateStat("mana", parsedStatuses.value.mana ?? 0)
    if (!mana.ok) return NextResponse.json({ message: mana.message }, { status: 400 })

    const exhaustion = validateStat("exaustão", parsedStatuses.value.exhaustion ?? 0)
    if (!exhaustion.ok) return NextResponse.json({ message: exhaustion.message }, { status: 400 })

    const sanity = validateStat("sanidade", parsedStatuses.value.sanity ?? 0)
    if (!sanity.ok) return NextResponse.json({ message: sanity.message }, { status: 400 })

    if (!permission.isOwner && body.skills !== undefined) {
      return NextResponse.json(
        { message: "Somente mestre ou moderador podem editar pericias de personagens." },
        { status: 403 },
      )
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
      if (
        !(
          error instanceof Error &&
          error.message.includes('relation "rpg_skill_templates" does not exist')
        )
      ) {
        throw error
      }
    }
    const skillTemplate = dbSkillTemplate

    const defaultSkills = skillTemplate.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = 0
      return acc
    }, {})
    const currentSkills =
      permission.currentSkills &&
      typeof permission.currentSkills === "object" &&
      !Array.isArray(permission.currentSkills)
        ? (permission.currentSkills as Record<string, number>)
        : defaultSkills
    const incomingSkills = permission.isOwner
      ? body.skills ?? currentSkills
      : currentSkills
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

    const currentIdentity =
      permission.currentIdentity &&
      typeof permission.currentIdentity === "object" &&
      !Array.isArray(permission.currentIdentity)
        ? (permission.currentIdentity as Record<string, unknown>)
        : {}
    const incomingIdentity =
      body.identity === undefined
        ? currentIdentity
        : body.identity
    const parsedIdentity = validateIdentityPayload(incomingIdentity, identityTemplate)
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

    const currentCharacteristics =
      permission.currentCharacteristics &&
      typeof permission.currentCharacteristics === "object" &&
      !Array.isArray(permission.currentCharacteristics)
        ? (permission.currentCharacteristics as Record<string, unknown>)
        : {}
    const incomingCharacteristics =
      body.characteristics === undefined
        ? currentCharacteristics
        : body.characteristics
    const parsedCharacteristics = validateCharacteristicsPayload(
      incomingCharacteristics,
      characteristicsTemplate,
    )
    if (!parsedCharacteristics.ok) {
      return NextResponse.json({ message: parsedCharacteristics.message }, { status: 400 })
    }

    const updated = await prisma.$queryRaw<
      Array<{
        id: string
      }>
    >(Prisma.sql`
      UPDATE rpg_characters
      SET
        name = ${name},
        image = CASE WHEN ${hasImageInBody} THEN ${image} ELSE image END,
        visibility = COALESCE(${visibility}::"RpgVisibility", visibility),
        max_carry_weight = CASE
          WHEN ${hasMaxCarryWeightInBody} THEN ${resolvedMaxCarryWeight}
          ELSE max_carry_weight
        END,
        life = ${life.value},
        defense = ${defense.value},
        mana = ${mana.value},
        stamina = ${exhaustion.value},
        sanity = ${sanity.value},
        statuses = ${JSON.stringify(parsedStatuses.value)}::jsonb,
        current_statuses = ${JSON.stringify(normalizedCurrentStatuses)}::jsonb,
        attributes = ${JSON.stringify(parsedAttributes.value)}::jsonb,
        skills = ${JSON.stringify(parsedSkills.value)}::jsonb,
        identity = ${JSON.stringify(parsedIdentity.value)}::jsonb,
        characteristics = ${JSON.stringify(parsedCharacteristics.value)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      RETURNING id
    `)

    if (updated.length === 0) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    if (hasImageInBody && previousImage && previousImage !== image) {
      const imageKitConfig = getImageKitConfig()
      if (imageKitConfig.ok) {
        const allowedFolderPaths = [
          buildCharacterFolder(permission.rpgOwnerId),
          ...(permission.characterCreatedByUserId
            ? [buildCharacterFolder(permission.characterCreatedByUserId)]
            : []),
        ]
        try {
          await deleteImageKitFileByUrl(
            imageKitConfig.privateKey,
            imageKitConfig.urlEndpoint,
            previousImage,
            allowedFolderPaths,
          )
        } catch {
          // Nao bloqueia a atualizacao do personagem caso a limpeza da imagem falhe.
        }
      }
    }

    return NextResponse.json({ message: "Personagem atualizado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
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
    if (error instanceof Error && error.message.includes('column "current_statuses" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "max_carry_weight" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "use_inventory_weight_limit" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
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
      { message: "Erro interno ao atualizar personagem." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const permission = await canManageCharacter(rpgId, characterId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const isOwner = permission.isOwner
    let imageUrl: string | null = null

    try {
      const currentCharacter = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
        SELECT image
        FROM rpg_characters
        WHERE id = ${characterId}
          AND rpg_id = ${rpgId}
        LIMIT 1
      `)
      imageUrl = currentCharacter[0]?.image ?? null
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.includes('column "image" does not exist')
        )
      ) {
        throw error
      }
    }

    const deleted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
        ${
          isOwner
            ? Prisma.empty
            : Prisma.sql`AND created_by_user_id = ${userId}`
        }
      RETURNING id
    `)

    if (deleted.length === 0) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    const imageKitConfig = getImageKitConfig()
    if (imageKitConfig.ok) {
      const allowedFolderPaths = [
        buildCharacterFolder(permission.rpgOwnerId),
        ...(permission.characterCreatedByUserId
          ? [buildCharacterFolder(permission.characterCreatedByUserId)]
          : []),
      ]
      try {
        await deleteImageKitFileByUrl(
          imageKitConfig.privateKey,
          imageKitConfig.urlEndpoint,
          imageUrl,
          allowedFolderPaths,
        )
      } catch {
        // Nao bloqueia a exclusao do personagem caso a limpeza da imagem falhe.
      }
    }

    return NextResponse.json({ message: "Personagem deletado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao deletar personagem." },
      { status: 500 },
    )
  }
}
