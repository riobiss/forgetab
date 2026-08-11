import {
  DEFAULT_STATUS_KEYS,
  STATUS_CATALOG
} from "@forgetab/world-contracts/rpg/statusCatalog"
import type { RpgConfigAccessService } from "@/features/world/application/config/ports/RpgConfigAccessService"
import type { RpgConfigRepository } from "@/features/world/application/config/ports/RpgConfigRepository"
import {
  assertCanManageRpg,
  assertCanReadRpg,
  wrapAttributeError,
  wrapCharacteristicError,
  wrapIdentityError,
  wrapSkillError,
  wrapStatusError
} from "./shared"
import {
  normalizeAttributeTemplates,
  normalizeSkillTemplates,
  normalizeStatusKey,
  normalizeStatusLabel,
  normalizeStatusTemplates,
  normalizeTemplateFields
} from "./configTemplateNormalizers"

export async function getAttributeTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string }
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const attributes = await repository.listAttributeTemplates(params.rpgId)
    return { attributes, isDefault: attributes.length === 0 }
  } catch (error) {
    wrapAttributeError(error, "Erro interno ao buscar atributos.")
  }
}

export async function updateAttributeTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; attributes: unknown }
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    await repository.replaceAttributeTemplates(
      params.rpgId,
      normalizeAttributeTemplates(params.attributes)
    )
    return { message: "Padrao de atributos atualizado." }
  } catch (error) {
    wrapAttributeError(error, "Erro interno ao atualizar atributos.")
  }
}

export async function getStatusTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string }
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const rows = await repository.listStatusTemplates(params.rpgId)
    if (rows.length === 0) {
      return {
        statuses: STATUS_CATALOG.filter((item) =>
          DEFAULT_STATUS_KEYS.includes(item.key)
        ).map((item, position) => ({
          id: `default-${item.key}`,
          key: item.key,
          label: item.label,
          position
        })),
        isDefault: true
      }
    }
    return {
      statuses: rows.map((item) => {
        const key = normalizeStatusKey(item.key)
        return { ...item, key, label: normalizeStatusLabel(key, item.label) }
      }),
      isDefault: false
    }
  } catch (error) {
    wrapStatusError(error, "Erro interno ao buscar status.")
  }
}

export async function updateStatusTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; statuses: unknown }
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    await repository.replaceStatusTemplates(
      params.rpgId,
      normalizeStatusTemplates(params.statuses)
    )
    return { message: "Padrao de status atualizado." }
  } catch (error) {
    wrapStatusError(error, "Erro interno ao atualizar status.")
  }
}

export async function getSkillTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string }
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const skills = await repository.listSkillTemplates(params.rpgId)
    return { skills, isDefault: skills.length === 0 }
  } catch (error) {
    wrapSkillError(error, "Erro interno ao buscar pericias.")
  }
}

export async function updateSkillTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; skills: unknown }
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    await repository.replaceSkillTemplates(
      params.rpgId,
      normalizeSkillTemplates(params.skills)
    )
    return { message: "Padrao de pericias atualizado." }
  } catch (error) {
    wrapSkillError(error, "Erro interno ao atualizar pericias.")
  }
}

async function updateFields(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; fields: unknown },
  kind: "identity" | "characteristic"
) {
  assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
  const identity = kind === "identity"
  const values = normalizeTemplateFields(
    params.fields,
    identity
      ? "Campo de identidade invalido."
      : "Campo de caracteristica invalido.",
    identity
      ? "Cada campo de identidade precisa ter nome com pelo menos 2 caracteres."
      : "Cada campo de caracteristica precisa ter nome com pelo menos 2 caracteres.",
    identity ? "campo-identidade" : "campo-caracteristica"
  )
  if (identity) await repository.replaceIdentityTemplates(params.rpgId, values)
  else await repository.replaceCharacteristicTemplates(params.rpgId, values)
  return {
    message: identity
      ? "Campos de identidade atualizados."
      : "Campos de caracteristicas atualizados."
  }
}

export async function getIdentityTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string }
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    return { fields: await repository.listIdentityTemplates(params.rpgId) }
  } catch (error) {
    wrapIdentityError(error, "Erro interno ao buscar campos de identidade.")
  }
}

export async function updateIdentityTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; fields: unknown }
) {
  try {
    return await updateFields(access, repository, params, "identity")
  } catch (error) {
    wrapIdentityError(error, "Erro interno ao salvar campos de identidade.")
  }
}

export async function getCharacteristicTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string }
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    return {
      fields: await repository.listCharacteristicTemplates(params.rpgId)
    }
  } catch (error) {
    wrapCharacteristicError(
      error,
      "Erro interno ao buscar campos de caracteristicas."
    )
  }
}

export async function updateCharacteristicTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; fields: unknown }
) {
  try {
    return await updateFields(access, repository, params, "characteristic")
  } catch (error) {
    wrapCharacteristicError(
      error,
      "Erro interno ao salvar campos de caracteristicas."
    )
  }
}
