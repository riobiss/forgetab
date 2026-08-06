import { createLibrarySectionSchema } from "@/lib/validators/library"
import type { LibraryAccessService } from "@/features/world/library/application/ports/LibraryAccessService"
import type { LibrarySectionRepository } from "@/features/world/library/application/ports/LibraryRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import {
  canViewLibrarySection,
  ensureCanManageOwnedResource,
  ensureCanViewLibrarySection,
  ensureCanViewRpg,
  normalizeDescription,
  wrapLibraryError
} from "./shared"

type Dependencies = {
  repository: LibrarySectionRepository
  accessService: LibraryAccessService
}

export async function listLibrarySections(
  deps: Dependencies,
  params: { rpgId: string; userId: string }
) {
  try {
    const access = await deps.accessService.getRpgAccess(
      params.rpgId,
      params.userId
    )
    ensureCanViewRpg(access.exists, access.canView)
    const sections = await deps.repository.listSections(params.rpgId)

    return {
      sections: sections
        .filter((section) =>
          canViewLibrarySection(section, params.userId, access.canManage)
        )
        .map((section) => ({
          ...section,
          canEdit:
            access.canManage || section.createdByUserId === params.userId,
          canDelete:
            access.canManage || section.createdByUserId === params.userId
        })),
      canManage: access.canManage
    }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao listar secoes.")
  }
}

export async function createLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; userId: string; body: unknown }
) {
  try {
    const access = await deps.accessService.getRpgAccess(
      params.rpgId,
      params.userId
    )
    ensureCanViewRpg(access.exists, access.canView)
    const parsed = createLibrarySectionSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Dados invalidos.",
        400
      )
    }

    const section = await deps.repository.createSection({
      rpgId: params.rpgId,
      userId: params.userId,
      title: parsed.data.title.trim(),
      description: normalizeDescription(parsed.data.description),
      visibility: parsed.data.visibility
    })
    return { section }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao criar secao.")
  }
}

export async function getLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string }
) {
  try {
    const access = await deps.accessService.getRpgAccess(
      params.rpgId,
      params.userId
    )
    ensureCanViewRpg(access.exists, access.canView)
    const section = await deps.repository.findSection(
      params.rpgId,
      params.sectionId
    )
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    ensureCanViewLibrarySection(section, params.userId, access.canManage)

    return {
      section: {
        ...section,
        canEdit: access.canManage || section.createdByUserId === params.userId,
        canDelete: access.canManage || section.createdByUserId === params.userId
      },
      canManage: access.canManage
    }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao buscar secao.")
  }
}

export async function updateLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string; body: unknown }
) {
  try {
    const access = await deps.accessService.getRpgAccess(
      params.rpgId,
      params.userId
    )
    const owner = await deps.repository.findSectionOwner({
      rpgId: params.rpgId,
      sectionId: params.sectionId
    })
    ensureCanManageOwnedResource(access, owner, params.userId, "Secao")

    const parsed = createLibrarySectionSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Dados invalidos.",
        400
      )
    }
    const section = await deps.repository.updateSection({
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      title: parsed.data.title.trim(),
      description: normalizeDescription(parsed.data.description),
      visibility: parsed.data.visibility
    })
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    return { section }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao atualizar secao.")
  }
}

export async function deleteLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string }
) {
  try {
    const access = await deps.accessService.getRpgAccess(
      params.rpgId,
      params.userId
    )
    const owner = await deps.repository.findSectionOwner({
      rpgId: params.rpgId,
      sectionId: params.sectionId
    })
    ensureCanManageOwnedResource(access, owner, params.userId, "Secao")
    const deleted = await deps.repository.deleteSection(
      params.rpgId,
      params.sectionId
    )
    if (!deleted) throw new AppError("Secao nao encontrada.", 404)
    return { message: "Secao removida com sucesso." }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao remover secao.")
  }
}
