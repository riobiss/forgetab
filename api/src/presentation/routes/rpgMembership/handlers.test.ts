import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  expelMemberUseCase: vi.fn(),
  getCharacterRequestsUseCase: vi.fn(),
  listRpgMembersUseCase: vi.fn(),
  processCharacterRequestUseCase: vi.fn(),
  processMemberActionUseCase: vi.fn(),
  requestCharacterCreationUseCase: vi.fn(),
  requestJoinRpgUseCase: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/application/rpgMembership/use-cases/rpgMembership", () => ({
  expelMemberUseCase: mocks.expelMemberUseCase,
  getCharacterRequestsUseCase: mocks.getCharacterRequestsUseCase,
  listRpgMembersUseCase: mocks.listRpgMembersUseCase,
  processCharacterRequestUseCase: mocks.processCharacterRequestUseCase,
  processMemberActionUseCase: mocks.processMemberActionUseCase,
  requestCharacterCreationUseCase: mocks.requestCharacterCreationUseCase,
  requestJoinRpgUseCase: mocks.requestJoinRpgUseCase,
}))

import { buildApiServer } from "@api/app"

describe("rpg membership routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao listar membros sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/members",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 quando nao encontra membros do RPG", async () => {
    server = buildApiServer()
    mocks.listRpgMembersUseCase.mockRejectedValueOnce(new AppError("RPG nao encontrado.", 404))

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/members",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com a lista de membros", async () => {
    server = buildApiServer()
    mocks.listRpgMembersUseCase.mockResolvedValueOnce({
      users: [
        {
          id: "member-1",
          userId: "user-2",
          name: "Ana",
          email: "ana@email.com",
          status: "accepted",
          isModerator: false,
        },
      ],
      canManage: true,
      isOwner: true,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/members",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      users: [
        {
          id: "member-1",
          userId: "user-2",
          name: "Ana",
          email: "ana@email.com",
          status: "accepted",
          isModerator: false,
        },
      ],
      canManage: true,
      isOwner: true,
    })
  })

  it("retorna 409 quando ja existe solicitacao pendente para entrar no RPG", async () => {
    server = buildApiServer()
    mocks.requestJoinRpgUseCase.mockRejectedValueOnce(
      new AppError("Voce ja possui uma solicitacao pendente para este RPG.", 409),
    )

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/members",
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      message: "Voce ja possui uma solicitacao pendente para este RPG.",
    })
  })

  it("retorna 201 ao solicitar entrada no RPG", async () => {
    server = buildApiServer()
    mocks.requestJoinRpgUseCase.mockResolvedValueOnce({
      status: 201,
      message: "Solicitacao enviada com sucesso.",
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/members",
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.requestJoinRpgUseCase).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({ message: "Solicitacao enviada com sucesso." })
  })

  it("retorna 400 quando acao de membro e invalida", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/members/member-1",
      payload: { action: "ban" },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: "Acao invalida." })
  })

  it("retorna 200 ao alternar moderacao de membro", async () => {
    server = buildApiServer()
    mocks.processMemberActionUseCase.mockResolvedValueOnce({
      message: "Membro atualizado com sucesso.",
      member: {
        id: "member-1",
        isModerator: true,
      },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/members/member-1",
      payload: { action: "toggleModerator" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.processMemberActionUseCase).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {
        rpgId: "rpg-1",
        userId: "user-1",
        memberId: "member-1",
        action: "toggleModerator",
      },
    )
    expect(response.json()).toEqual({
      message: "Membro atualizado com sucesso.",
      member: {
        id: "member-1",
        isModerator: true,
      },
    })
  })

  it("retorna 404 ao expulsar membro inexistente", async () => {
    server = buildApiServer()
    mocks.expelMemberUseCase.mockRejectedValueOnce(new AppError("Membro nao encontrado.", 404))

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/members/member-1",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "Membro nao encontrado." })
  })

  it("retorna 200 ao expulsar membro", async () => {
    server = buildApiServer()
    mocks.expelMemberUseCase.mockResolvedValueOnce({
      message: "Membro removido com sucesso.",
    })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/members/member-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Membro removido com sucesso." })
  })

  it("retorna 200 com solicitacoes de personagem", async () => {
    server = buildApiServer()
    mocks.getCharacterRequestsUseCase.mockResolvedValueOnce({
      pendingRequests: [
        {
          id: "request-1",
          userId: "user-2",
          userName: "Leo",
          status: "pending",
        },
      ],
      requestStatus: null,
      canManage: true,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/character-requests",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      pendingRequests: [
        {
          id: "request-1",
          userId: "user-2",
          userName: "Leo",
          status: "pending",
        },
      ],
      requestStatus: null,
      canManage: true,
    })
  })

  it("retorna 409 quando ja existe solicitacao pendente de personagem", async () => {
    server = buildApiServer()
    mocks.requestCharacterCreationUseCase.mockRejectedValueOnce(
      new AppError("Ja existe uma solicitacao pendente para criar personagem.", 409),
    )

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/character-requests",
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      message: "Ja existe uma solicitacao pendente para criar personagem.",
    })
  })

  it("retorna 201 ao solicitar criacao de personagem", async () => {
    server = buildApiServer()
    mocks.requestCharacterCreationUseCase.mockResolvedValueOnce({
      status: 201,
      message: "Solicitacao de personagem enviada com sucesso.",
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/character-requests",
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      message: "Solicitacao de personagem enviada com sucesso.",
    })
  })

  it("retorna 400 quando acao de solicitacao de personagem e invalida", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/character-requests/request-1",
      payload: { action: "archive" },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: "Acao invalida." })
  })

  it("retorna 200 ao aprovar solicitacao de personagem", async () => {
    server = buildApiServer()
    mocks.processCharacterRequestUseCase.mockResolvedValueOnce({
      message: "Solicitacao processada com sucesso.",
      request: {
        id: "request-1",
        status: "accepted",
      },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/character-requests/request-1",
      payload: { action: "accept" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.processCharacterRequestUseCase).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {
        rpgId: "rpg-1",
        userId: "user-1",
        requestId: "request-1",
        action: "accept",
      },
    )
    expect(response.json()).toEqual({
      message: "Solicitacao processada com sucesso.",
      request: {
        id: "request-1",
        status: "accepted",
      },
    })
  })
})
