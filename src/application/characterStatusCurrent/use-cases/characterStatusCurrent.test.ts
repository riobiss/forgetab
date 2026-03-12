import { describe, expect, it, vi } from "vitest"
import type { CharacterStatusCurrentRepository } from "@/application/characterStatusCurrent/ports/CharacterStatusCurrentRepository"
import { updateCharacterStatusCurrentUseCase } from "@/application/characterStatusCurrent/use-cases/characterStatusCurrent"

function createRepositoryMock(): CharacterStatusCurrentRepository {
  return {
    getRpg: vi.fn(),
    getMembership: vi.fn(),
    getCharacter: vi.fn(),
    updateCharacterStatus: vi.fn(),
  }
}

describe("updateCharacterStatusCurrentUseCase", () => {
  it("retorna 404 quando o RPG nao existe", async () => {
    const repository = createRepositoryMock()
    vi.mocked(repository.getRpg).mockResolvedValue(null)

    await expect(
      updateCharacterStatusCurrentUseCase(repository, {
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        body: { key: "life", value: 5 },
      }),
    ).rejects.toMatchObject({ message: "RPG nao encontrado.", status: 404 })
  })

  it("retorna 403 quando o usuario nao pode editar o personagem", async () => {
    const repository = createRepositoryMock()
    vi.mocked(repository.getRpg).mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
    vi.mocked(repository.getMembership).mockResolvedValue({ status: "accepted", role: "player" })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      createdByUserId: "other-user",
      statuses: { life: 10 },
      currentStatuses: { life: 10 },
    })

    await expect(
      updateCharacterStatusCurrentUseCase(repository, {
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        body: { key: "life", value: 5 },
      }),
    ).rejects.toMatchObject({ message: "Sem permissao para editar este personagem.", status: 403 })
  })

  it("retorna 400 para valor fora do limite", async () => {
    const repository = createRepositoryMock()
    vi.mocked(repository.getRpg).mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      createdByUserId: "owner-1",
      statuses: { life: 10 },
      currentStatuses: { life: 10 },
    })

    await expect(
      updateCharacterStatusCurrentUseCase(repository, {
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "owner-1",
        body: { key: "life", value: 11 },
      }),
    ).rejects.toMatchObject({ message: "Valor atual fora do limite permitido.", status: 400 })
  })

  it("atualiza o status atual com sucesso", async () => {
    const repository = createRepositoryMock()
    vi.mocked(repository.getRpg).mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      createdByUserId: "owner-1",
      statuses: { life: 10, mana: 5 },
      currentStatuses: { life: 9, mana: 5 },
    })
    vi.mocked(repository.updateCharacterStatus).mockResolvedValue(true)

    const result = await updateCharacterStatusCurrentUseCase(repository, {
      rpgId: "rpg-1",
      characterId: "char-1",
      userId: "owner-1",
      body: { key: "life", value: 6 },
    })

    expect(result).toEqual({
      message: "Status atual salvo.",
      key: "life",
      value: 6,
      max: 10,
    })
    expect(repository.updateCharacterStatus).toHaveBeenCalledWith("rpg-1", "char-1", {
      currentStatuses: { life: 6, mana: 5 },
      nextValue: 6,
      coreColumn: "life",
    })
  })
})
