import {
  buildSkillSlug,
  skillMetaCreateSchema,
  type SkillMetaCreateInput,
} from "@/lib/validators/skillBuilder"
import type { RpgPermissionService } from "@/features/world/skill/application/ports/RpgPermissionService"
import type { SkillCreateRepository } from "@/features/world/skill/application/ports/SkillRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

type CreateSkillDeps = {
  repository: SkillCreateRepository
  permissionService: RpgPermissionService
}

function readLevel1Category(input: SkillMetaCreateInput) {
  if (!input.level1?.stats || typeof input.level1.stats !== "object") {
    return null
  }

  const category = (input.level1.stats as { category?: unknown }).category
  return typeof category === "string" ? category : null
}

function readLevel1Name(input: SkillMetaCreateInput) {
  if (!input.level1?.stats || typeof input.level1.stats !== "object") {
    return null
  }

  const name = (input.level1.stats as { name?: unknown }).name
  return typeof name === "string" ? name : null
}

export async function createSkill(
  deps: CreateSkillDeps,
  params: { userId: string; body: unknown },
) {
  try {
    const parsed = skillMetaCreateSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Dados invalidos.",
        400,
      )
    }

    const rpgId = parsed.data.rpgId ?? null
    if (rpgId) {
      const canManage = await deps.permissionService.canManageRpg(
        rpgId,
        params.userId,
      )
      if (!canManage) {
        throw new AppError("RPG nao encontrado.", 404)
      }
    }

    const abilityCategoryConfig =
      await deps.repository.getAbilityCategoryConfig(rpgId)
    if (
      abilityCategoryConfig.enabled &&
      abilityCategoryConfig.categories.length === 0
    ) {
      throw new AppError("Ative pelo menos uma categoria", 400)
    }

    const level1Category = readLevel1Category(parsed.data)
    if (abilityCategoryConfig.enabled) {
      if (!level1Category) {
        throw new AppError("Categoria obrigatoria para criar habilidade.", 400)
      }
      if (!abilityCategoryConfig.categories.includes(level1Category)) {
        throw new AppError("Categoria desativada para este RPG.", 400)
      }
    }

    const validatedLinks = await deps.repository.validateLinkIds({
      rpgId,
      classIds: parsed.data.classIds ?? [],
      raceIds: parsed.data.raceIds ?? [],
    })

    if (!validatedLinks.ok) {
      throw new AppError(validatedLinks.message, 400)
    }

    const level1Name = readLevel1Name(parsed.data)
    const slug = buildSkillSlug(parsed.data.slug ?? level1Name ?? "")
    const createdSkillId = await deps.repository.createSkillRecord({
      userId: params.userId,
      rpgId,
      slug,
      tags: parsed.data.tags ?? [],
      classIds: parsed.data.classIds ?? [],
      raceIds: parsed.data.raceIds ?? [],
      level1: parsed.data.level1,
    })

    const created = await deps.repository.findById(
      createdSkillId,
      params.userId,
    )
    return { skill: created }
  } catch (error) {
    mapSkillError(error, "Erro interno ao criar skill.")
  }
}
