import { normalizeEntityCatalogMeta } from "@/features/world/catalog/domain/catalogMeta"
import { normalizeClassRaceTemplates } from "@forgetab/world-contracts/rpg/classRaceBonuses"
import { normalizeRaceLore } from "@forgetab/world-contracts/rpg/raceLore"
import type { RpgConfigAccessService } from "@/features/world/application/config/ports/RpgConfigAccessService"
import type { RpgConfigRepository } from "@/features/world/application/config/ports/RpgConfigRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import {
  assertCanManageRpg,
  assertCanReadRpg,
  wrapClassError,
  wrapRaceError
} from "./shared"
import {
  createStableTemplateKey,
  createUniqueKey,
  parseJsonRecord,
  readOptionalTemplateId
} from "./configTemplateNormalizers"

function readObjectEntry(entries: unknown[], index: number) {
  const source = entries[index]
  return source && typeof source === "object" && !Array.isArray(source)
    ? (source as Record<string, unknown>)
    : null
}

async function normalizeClassRaceInput(
  repository: RpgConfigRepository,
  rpgId: string,
  input: unknown
) {
  const [allowedAttributeKeys, allowedSkillKeys] = await Promise.all([
    repository.listAttributeKeys(rpgId),
    repository.listSkillKeys(rpgId)
  ])
  const entries = Array.isArray(input) ? input : []
  const parsed = normalizeClassRaceTemplates(
    entries,
    allowedAttributeKeys,
    allowedSkillKeys
  )
  if (!parsed.ok) throw new AppError(parsed.message, 400)
  return { entries, values: parsed.values }
}

export async function getRaceTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string }
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const rows = await repository.listRaceTemplates(params.rpgId)
    return {
      races: rows.map((item) => ({
        id: item.id,
        key: item.key,
        label: item.label,
        category: item.category ?? "geral",
        position: item.position,
        attributeBonuses: parseJsonRecord(item.attributeBonuses),
        skillBonuses: parseJsonRecord(item.skillBonuses),
        lore: normalizeRaceLore(item.lore, item.label),
        catalogMeta: normalizeEntityCatalogMeta(item.catalogMeta)
      }))
    }
  } catch (error) {
    wrapRaceError(error, "Erro interno ao buscar racas.")
  }
}

export async function updateRaceTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; races: unknown }
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    const parsed = await normalizeClassRaceInput(
      repository,
      params.rpgId,
      params.races
    )
    const used = new Set<string>()
    const items = parsed.values.map((item, index) => {
      const source = readObjectEntry(parsed.entries, index)
      return {
        id: readOptionalTemplateId(source),
        key: createStableTemplateKey(source, item.label, used, "raca"),
        label: item.label,
        category: item.category,
        attributeBonuses: item.attributeBonuses,
        skillBonuses: item.skillBonuses,
        lore: normalizeRaceLore(source?.lore, item.label),
        catalogMeta: normalizeEntityCatalogMeta(source?.catalogMeta)
      }
    })
    await repository.replaceRaceTemplates(params.rpgId, items)
    return { message: "Racas atualizadas com sucesso." }
  } catch (error) {
    wrapRaceError(error, "Erro interno ao salvar racas.")
  }
}

export async function getClassTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string }
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const rows = await repository.listClassTemplates(params.rpgId)
    return {
      classes: rows.map((item) => ({
        id: item.id,
        key: item.key,
        label: item.label,
        category: item.category ?? "geral",
        position: item.position,
        attributeBonuses: parseJsonRecord(item.attributeBonuses),
        skillBonuses: parseJsonRecord(item.skillBonuses),
        catalogMeta: normalizeEntityCatalogMeta(item.catalogMeta)
      }))
    }
  } catch (error) {
    wrapClassError(error, "Erro interno ao buscar classes.")
  }
}

export async function updateClassTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; classes: unknown }
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    const parsed = await normalizeClassRaceInput(
      repository,
      params.rpgId,
      params.classes
    )
    const used = new Set<string>()
    await repository.replaceClassTemplates(
      params.rpgId,
      parsed.values.map((item, index) => {
        const source = readObjectEntry(parsed.entries, index)
        return {
          id: readOptionalTemplateId(source),
          key: source
            ? createStableTemplateKey(source, item.label, used, "classe")
            : createUniqueKey(item.label, used, "classe"),
          label: item.label,
          category: item.category,
          attributeBonuses: item.attributeBonuses,
          skillBonuses: item.skillBonuses,
          catalogMeta: normalizeEntityCatalogMeta(source?.catalogMeta)
        }
      })
    )
    return { message: "Classes atualizadas com sucesso." }
  } catch (error) {
    wrapClassError(error, "Erro interno ao salvar classes.")
  }
}
