import { AppError } from "@/shared/errors/AppError"
import type { RpgMembershipAccessService } from "@/application/rpgMembership/ports/RpgMembershipAccessService"
import type { RpgMembershipRepository } from "@/application/rpgMembership/ports/RpgMembershipRepository"
import {
  wrapCharacterRequestsError,
  wrapMembersError,
} from "@/application/rpgMembership/use-cases/shared"

export async function listRpgMembersUseCase(
  repository: RpgMembershipRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    const rpg = await repository.getRpgSummary(params.rpgId)
    if (!rpg) throw new AppError("RPG nao encontrado.", 404)
    if (rpg.ownerId !== params.userId) {
      const membership = await repository.getMembership(params.rpgId, params.userId)
      if (membership?.status !== "accepted") {
        throw new AppError("RPG nao encontrado.", 404)
      }
    }

    const users = await repository.listAllowedUsers(params.rpgId)
    return { users }
  } catch (error) {
    wrapMembersError(error, "Erro interno ao listar membros.")
  }
}

export async function requestJoinRpgUseCase(
  repository: RpgMembershipRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    const rpg = await repository.getRpgSummary(params.rpgId)
    if (!rpg) throw new AppError("RPG nao encontrado.", 404)
    if (rpg.ownerId === params.userId) {
      throw new AppError("Voce ja e o mestre deste RPG.", 400)
    }

    const existing = await repository.getMembership(params.rpgId, params.userId)
    if (!existing) {
      await repository.createPendingMembership(params.rpgId, params.userId)
      return { message: "Solicitacao enviada para o mestre.", status: 201 }
    }
    if (existing.status === "accepted") {
      throw new AppError("Voce ja e membro deste RPG.", 409)
    }
    if (existing.status === "pending") {
      throw new AppError("Voce ja possui uma solicitacao pendente.", 409)
    }

    await repository.resendMembershipRequest(existing.id)
    return { message: "Solicitacao reenviada para o mestre.", status: 200 }
  } catch (error) {
    wrapMembersError(error, "Erro interno ao solicitar participacao.")
  }
}

export async function processMemberActionUseCase(
  access: RpgMembershipAccessService,
  repository: RpgMembershipRepository,
  params: {
    rpgId: string
    userId: string
    memberId: string
    action: "accept" | "reject" | "toggleModerator"
  },
) {
  try {
    const permission = await access.getPermission(params.rpgId, params.userId)
    if (!permission.exists) throw new AppError("RPG nao encontrado.", 404)
    if (!permission.canManage) {
      throw new AppError("Somente mestre ou moderador podem gerenciar membros.", 403)
    }

    if (params.action === "toggleModerator") {
      const updated = await repository.toggleModerator(
        params.rpgId,
        params.memberId,
        permission.ownerId ?? "",
      )
      if (!updated) throw new AppError("Membro nao encontrado para alternar moderacao.", 404)
      return {
        message:
          updated.role === "moderator"
            ? "Membro promovido para moderador."
            : "Membro removido da moderacao.",
        role: updated.role,
      }
    }

    const updated = await repository.processMembershipRequest(
      params.rpgId,
      params.memberId,
      params.action === "accept" ? "accepted" : "rejected",
    )
    if (!updated) throw new AppError("Solicitacao nao encontrada ou ja processada.", 404)
    return {
      message: params.action === "accept" ? "Solicitacao aprovada." : "Solicitacao recusada.",
    }
  } catch (error) {
    wrapMembersError(error, "Erro interno ao processar solicitacao.")
  }
}

export async function expelMemberUseCase(
  access: RpgMembershipAccessService,
  repository: RpgMembershipRepository,
  params: { rpgId: string; userId: string; memberId: string },
) {
  try {
    const permission = await access.getPermission(params.rpgId, params.userId)
    if (!permission.exists) throw new AppError("RPG nao encontrado.", 404)
    if (!permission.canManage) {
      throw new AppError("Somente mestre ou moderador podem gerenciar membros.", 403)
    }

    const deleted = await repository.expelMember(params.rpgId, params.memberId, permission.ownerId ?? "")
    if (!deleted) throw new AppError("Membro nao encontrado para expulsao.", 404)
    return { message: "Membro expulso com sucesso." }
  } catch (error) {
    wrapMembersError(error, "Erro interno ao expulsar membro.")
  }
}

export async function getCharacterRequestsUseCase(
  access: RpgMembershipAccessService,
  repository: RpgMembershipRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    const rpg = await repository.getRpgSummary(params.rpgId)
    if (!rpg) throw new AppError("RPG nao encontrado.", 404)

    const permission = await access.getPermission(params.rpgId, params.userId)
    let isAcceptedMember = false

    if (!permission.canManage) {
      const membership = await repository.getMembership(params.rpgId, params.userId)
      isAcceptedMember = membership?.status === "accepted"
    }

    if (!permission.canManage && !isAcceptedMember) {
      throw new AppError("RPG nao encontrado.", 404)
    }

    if (permission.canManage) {
      const pendingRequests = await repository.listPendingCharacterRequests(params.rpgId)
      return { isOwner: true, pendingRequests, canRequest: false, canCreate: true }
    }

    const userRequest = await repository.getCharacterRequest(params.rpgId, params.userId)
    const requestStatus = userRequest?.status ?? null
    return {
      isOwner: false,
      canRequest: isAcceptedMember,
      canCreate: isAcceptedMember && requestStatus === "accepted",
      requestStatus,
    }
  } catch (error) {
    wrapCharacterRequestsError(error, "Erro interno ao consultar solicitacoes de personagem.")
  }
}

export async function requestCharacterCreationUseCase(
  access: RpgMembershipAccessService,
  repository: RpgMembershipRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    const rpg = await repository.getRpgSummary(params.rpgId)
    if (!rpg) throw new AppError("RPG nao encontrado.", 404)

    const permission = await access.getPermission(params.rpgId, params.userId)
    if (permission.canManage) {
      throw new AppError("Mestre ou moderador nao precisam solicitar criacao de personagem.", 400)
    }

    const membership = await repository.getMembership(params.rpgId, params.userId)
    if (membership?.status !== "accepted") {
      throw new AppError("Somente membros aceitos podem solicitar criacao de personagem.", 403)
    }

    const existing = await repository.getCharacterRequest(params.rpgId, params.userId)
    if (!existing) {
      await repository.createPendingCharacterRequest(params.rpgId, params.userId)
      return { message: "Solicitacao enviada para o mestre.", status: 201 }
    }
    if (existing.status === "pending") {
      throw new AppError("Voce ja possui uma solicitacao pendente.", 409)
    }
    if (existing.status === "accepted") {
      throw new AppError("Sua permissao para criar personagem ja foi aprovada.", 409)
    }

    await repository.resendCharacterRequest(existing.id)
    return { message: "Solicitacao reenviada para o mestre.", status: 200 }
  } catch (error) {
    wrapCharacterRequestsError(error, "Erro interno ao solicitar criacao de personagem.")
  }
}

export async function processCharacterRequestUseCase(
  access: RpgMembershipAccessService,
  repository: RpgMembershipRepository,
  params: { rpgId: string; userId: string; requestId: string; action: "accept" | "reject" },
) {
  try {
    const permission = await access.getPermission(params.rpgId, params.userId)
    if (!permission.exists) throw new AppError("RPG nao encontrado.", 404)
    if (!permission.canManage) {
      throw new AppError("Somente mestre ou moderador podem gerenciar solicitacoes de personagem.", 403)
    }

    const updated = await repository.processCharacterRequest(
      params.rpgId,
      params.requestId,
      params.action === "accept" ? "accepted" : "rejected",
    )
    if (!updated) throw new AppError("Solicitacao nao encontrada ou ja processada.", 404)
    return {
      message: params.action === "accept" ? "Solicitacao aprovada." : "Solicitacao recusada.",
    }
  } catch (error) {
    wrapCharacterRequestsError(error, "Erro interno ao processar solicitacao de personagem.")
  }
}

