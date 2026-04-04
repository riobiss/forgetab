import { describe, expect, it, vi } from "vitest"
import type { RpgConfigAccessService } from "@/application/rpgConfig/ports/RpgConfigAccessService"
import type { RpgConfigRepository } from "@/application/rpgConfig/ports/RpgConfigRepository"
import {
  getAttributeTemplates,
  getClassTemplates,
  getSkillTemplates,
  getStatusTemplates,
  updateAttributeTemplates,
  updateCharacteristicTemplates,
  updateClassTemplates,
  updateIdentityTemplates,
  updateRaceTemplates,
  updateSkillTemplates,
  updateStatusTemplates,
} from "@/application/rpgConfig/use-cases/rpgConfig"

function createAccessMock(): RpgConfigAccessService {
  return {
    canManageRpg: vi.fn().mockResolvedValue(true),
    canReadRpg: vi.fn().mockResolvedValue(true),
  }
}

function createRepositoryMock(): RpgConfigRepository {
  return {
    listAttributeTemplates: vi.fn().mockResolvedValue([]),
    replaceAttributeTemplates: vi.fn().mockResolvedValue(undefined),
    listStatusTemplates: vi.fn().mockResolvedValue([]),
    replaceStatusTemplates: vi.fn().mockResolvedValue(undefined),
    listSkillTemplates: vi.fn().mockResolvedValue([]),
    replaceSkillTemplates: vi.fn().mockResolvedValue(undefined),
    listRaceTemplates: vi.fn().mockResolvedValue([]),
    replaceRaceTemplates: vi.fn().mockResolvedValue(undefined),
    listClassTemplates: vi.fn().mockResolvedValue([]),
    replaceClassTemplates: vi.fn().mockResolvedValue(undefined),
    listIdentityTemplates: vi.fn().mockResolvedValue([]),
    replaceIdentityTemplates: vi.fn().mockResolvedValue(undefined),
    listCharacteristicTemplates: vi.fn().mockResolvedValue([]),
    replaceCharacteristicTemplates: vi.fn().mockResolvedValue(undefined),
    listAttributeKeys: vi.fn().mockResolvedValue(["str"]),
    listSkillKeys: vi.fn().mockResolvedValue(["fight"]),
  }
}

describe("rpgConfig use-cases", () => {
  it("getAttributeTemplates retorna isDefault quando vazio", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    const result = await getAttributeTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
    })

    expect(result).toEqual({ attributes: [], isDefault: true })
  })

  it("getStatusTemplates retorna fallback default quando nao ha linhas", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    const result = await getStatusTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
    })

    expect(result?.isDefault).toBe(true)
    expect(result?.statuses.length).toBeGreaterThan(0)
  })

  it("updateAttributeTemplates normaliza chaves duplicadas", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    await updateAttributeTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
      attributes: [{ label: "Forca" }, { label: "Forca" }],
    })

    expect(repository.replaceAttributeTemplates).toHaveBeenCalledWith("rpg-1", [
      { key: "forca", label: "Forca" },
      { key: "forca-2", label: "Forca" },
    ])
  })

  it("updateStatusTemplates normaliza stamina para exhaustion", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    await updateStatusTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
      statuses: ["stamina"],
    })

    expect(repository.replaceStatusTemplates).toHaveBeenCalledWith("rpg-1", [
      { key: "exhaustion", label: "Exaustão" },
    ])
  })

  it("getSkillTemplates retorna isDefault quando vazio", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    const result = await getSkillTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
    })

    expect(result).toEqual({ skills: [], isDefault: true })
  })

  it("updateSkillTemplates remove labels duplicados", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    await updateSkillTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
      skills: ["Furtividade", "Furtividade"],
    })

    expect(repository.replaceSkillTemplates).toHaveBeenCalledWith("rpg-1", [
      { key: "furtividade", label: "Furtividade" },
    ])
  })

  it("updateRaceTemplates usa allowed keys e normaliza lore", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    await updateRaceTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
      races: [
        {
          label: "Elfo",
          attributeBonuses: { str: 1 },
          skillBonuses: { fight: 2 },
          lore: { summary: "Antigos" },
        },
      ],
    })

    expect(repository.listAttributeKeys).toHaveBeenCalledWith("rpg-1")
    expect(repository.listSkillKeys).toHaveBeenCalledWith("rpg-1")
    expect(repository.replaceRaceTemplates).toHaveBeenCalledTimes(1)
    expect((repository.replaceRaceTemplates as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.[0]).toMatchObject({
      key: "elfo",
      label: "Elfo",
      attributeBonuses: { str: 1 },
      skillBonuses: { fight: 2 },
    })
  })

  it("getClassTemplates converte category null para geral", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()
    ;(repository.listClassTemplates as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "c1",
        key: "guerreiro",
        label: "Guerreiro",
        category: null,
        position: 0,
        attributeBonuses: { str: 2 },
        skillBonuses: { fight: 1 },
      },
    ])

    const result = await getClassTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
    })

    expect(result).toEqual({
      classes: [
        {
          id: "c1",
          key: "guerreiro",
          label: "Guerreiro",
          category: "geral",
          position: 0,
          attributeBonuses: { str: 2 },
          skillBonuses: { fight: 1 },
          catalogMeta: { shortDescription: null, richText: {} },
        },
      ],
    })
  })

  it("updateIdentityTemplates valida label curto", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    await expect(
      updateIdentityTemplates(access, repository, {
        rpgId: "rpg-1",
        userId: "u1",
        fields: [{ label: "A" }],
      }),
    ).rejects.toMatchObject({
      message: "Cada campo de identidade precisa ter nome com pelo menos 2 caracteres.",
      status: 400,
    })
  })

  it("updateCharacteristicTemplates gera chaves unicas", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    await updateCharacteristicTemplates(access, repository, {
      rpgId: "rpg-1",
      userId: "u1",
      fields: [{ label: "Olhos" }, { label: "Olhos", required: false }],
    })

    expect(repository.replaceCharacteristicTemplates).toHaveBeenCalledWith("rpg-1", [
      { key: "olhos", label: "Olhos", required: true },
      { key: "olhos-2", label: "Olhos", required: false },
    ])
  })

  it("updateClassTemplates propaga erro de validacao de bonuses", async () => {
    const access = createAccessMock()
    const repository = createRepositoryMock()

    await expect(
      updateClassTemplates(access, repository, {
        rpgId: "rpg-1",
        userId: "u1",
        classes: [{ label: "Mago", attributeBonuses: { agi: 1 } }],
      }),
    ).rejects.toMatchObject({
      message: "atributos fora do padrao: agi.",
      status: 400,
    })
  })
})
