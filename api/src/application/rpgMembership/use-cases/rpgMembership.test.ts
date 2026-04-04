import { describe, expect, it, vi } from "vitest"
import type { RpgMembershipAccessService } from "@/application/rpgMembership/ports/RpgMembershipAccessService"
import type { RpgMembershipRepository } from "@/application/rpgMembership/ports/RpgMembershipRepository"
import {
  getCharacterRequestsUseCase,
  listRpgMembersUseCase,
  processCharacterRequestUseCase,
  processMemberActionUseCase,
  requestCharacterCreationUseCase,
  requestJoinRpgUseCase,
} from "@/application/rpgMembership/use-cases/rpgMembership"

function createAccessMock(): RpgMembershipAccessService {
  return {
    getPermission: vi.fn().mockResolvedValue({
      exists: true,
      canManage: true,
      ownerId: "owner-1",
    }),
  }
}

function createRepositoryMock(): RpgMembershipRepository {
  return {
    getRpgSummary: vi.fn().mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "private",
    }),
    getMembership: vi.fn().mockResolvedValue(null),
    listAllowedUsers: vi.fn().mockResolvedValue([]),
    createPendingMembership: vi.fn().mockResolvedValue(undefined),
    resendMembershipRequest: vi.fn().mockResolvedValue(undefined),
    toggleModerator: vi.fn().mockResolvedValue({ role: "moderator" }),
    processMembershipRequest: vi.fn().mockResolvedValue(true),
    expelMember: vi.fn().mockResolvedValue(true),
    listPendingCharacterRequests: vi.fn().mockResolvedValue([]),
    getCharacterRequest: vi.fn().mockResolvedValue(null),
    createPendingCharacterRequest: vi.fn().mockResolvedValue(undefined),
    resendCharacterRequest: vi.fn().mockResolvedValue(undefined),
    processCharacterRequest: vi.fn().mockResolvedValue(true),
  }
}

describe("rpgMembership use-cases", () => {
  it("listRpgMembersUseCase retorna usuarios quando owner ou membro aceito", async () => {
    const repository = createRepositoryMock()
    ;(repository.getRpgSummary as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "private",
    })
    ;(repository.getMembership as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "m-1",
      status: "accepted",
    })
    ;(repository.listAllowedUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "u1", username: "user", name: "User" },
    ])

    const result = await listRpgMembersUseCase(repository, {
      rpgId: "rpg-1",
      userId: "user-1",
    })

    expect(result).toEqual({
      users: [{ id: "u1", username: "user", name: "User" }],
    })
  })

  it("requestJoinRpgUseCase cria solicitacao nova", async () => {
    const repository = createRepositoryMock()

    const result = await requestJoinRpgUseCase(repository, {
      rpgId: "rpg-1",
      userId: "user-1",
    })

    expect(repository.createPendingMembership).toHaveBeenCalledWith("rpg-1", "user-1")
    expect(result).toEqual({
      message: "Solicitacao enviada para o mestre.",
      status: 201,
    })
  })

  it("requestJoinRpgUseCase retorna 409 para pending", async () => {
    const repository = createRepositoryMock()
    ;(repository.getMembership as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "m-1",
      status: "pending",
    })

    await expect(
      requestJoinRpgUseCase(repository, {
        rpgId: "rpg-1",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      message: "Voce ja possui uma solicitacao pendente.",
      status: 409,
    })
  })

  it("processMemberActionUseCase alterna moderador", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    const result = await processMemberActionUseCase(access, repository, {
      rpgId: "rpg-1",
      userId: "owner-1",
      memberId: "m-1",
      action: "toggleModerator",
    })

    expect(repository.toggleModerator).toHaveBeenCalledWith("rpg-1", "m-1", "owner-1")
    expect(result).toEqual({
      message: "Membro promovido para moderador.",
      role: "moderator",
    })
  })

  it("getCharacterRequestsUseCase retorna pendingRequests para manager", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()
    ;(repository.listPendingCharacterRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "req-1",
        userId: "user-1",
        userUsername: "user",
        userName: "User",
        requestedAt: new Date("2026-03-10T10:00:00.000Z"),
      },
    ])

    const result = await getCharacterRequestsUseCase(access, repository, {
      rpgId: "rpg-1",
      userId: "owner-1",
    })

    expect(result).toEqual({
      isOwner: true,
      pendingRequests: [
        {
          id: "req-1",
          userId: "user-1",
          userUsername: "user",
          userName: "User",
          requestedAt: new Date("2026-03-10T10:00:00.000Z"),
        },
      ],
      canRequest: false,
      canCreate: true,
    })
  })

  it("requestCharacterCreationUseCase cria solicitacao para membro aceito", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()
    ;(access.getPermission as ReturnType<typeof vi.fn>).mockResolvedValue({
      exists: true,
      canManage: false,
      ownerId: "owner-1",
    })
    ;(repository.getMembership as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "m-1",
      status: "accepted",
    })

    const result = await requestCharacterCreationUseCase(access, repository, {
      rpgId: "rpg-1",
      userId: "user-1",
    })

    expect(repository.createPendingCharacterRequest).toHaveBeenCalledWith("rpg-1", "user-1")
    expect(result).toEqual({
      message: "Solicitacao enviada para o mestre.",
      status: 201,
    })
  })

  it("processCharacterRequestUseCase aprova solicitacao", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    const result = await processCharacterRequestUseCase(access, repository, {
      rpgId: "rpg-1",
      userId: "owner-1",
      requestId: "req-1",
      action: "accept",
    })

    expect(repository.processCharacterRequest).toHaveBeenCalledWith("rpg-1", "req-1", "accepted")
    expect(result).toEqual({
      message: "Solicitacao aprovada.",
    })
  })
})
