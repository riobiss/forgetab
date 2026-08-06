import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type {
  CharacterEditorBootstrapDto,
  CharactersEditorDependencies
} from "@/features/world/characters/application/editor"
import { useCharacterEditorController } from "./useCharacterEditorController"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}))

function createDependencies(): CharactersEditorDependencies {
  return {
    gateway: {
      fetchBootstrap: vi.fn(),
      fetchCharacter: vi.fn(),
      createCharacter: vi.fn(),
      updateCharacter: vi.fn(),
      deleteCharacter: vi.fn(),
      uploadCharacterImage: vi.fn(),
      deleteCharacterImageByUrl: vi.fn()
    }
  }
}

function createBootstrap(): CharacterEditorBootstrapDto {
  return {
    attributes: [{ key: "forca", label: "Forca", position: 0 }],
    statuses: [{ key: "vida", label: "Vida", position: 0 }],
    skills: [{ key: "furtividade", label: "Furtividade", position: 0 }],
    characters: [],
    rpg: {
      canManage: true,
      useRaceBonuses: true,
      useClassBonuses: false,
      progressionMode: "xp_level",
      progressionTiers: [
        { label: "Nivel 1", required: 0 },
        { label: "Nivel 2", required: 100 }
      ]
    },
    races: [{ key: "humano", label: "Humano" }],
    classes: [{ key: "guerreiro", label: "Guerreiro" }],
    identityFields: [
      { key: "nome", label: "Nome", required: true, position: 0 }
    ],
    characteristicFields: [
      { key: "aparencia", label: "Aparencia", required: false, position: 0 }
    ],
    assignablePlayers: [{ userId: "user-1", username: "ana", name: "Ana" }]
  }
}

describe("useCharacterEditorController", () => {
  it("aplica o bootstrap inicial e prepara um personagem novo", async () => {
    const deps = createDependencies()
    const initialBootstrap = createBootstrap()
    const { result } = renderHook(() =>
      useCharacterEditorController({
        rpgId: "rpg-1",
        deps,
        initialBootstrap
      })
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.attributes).toHaveLength(1)
    expect(result.current.values).toEqual({ forca: "" })
    expect(result.current.statusValues).toEqual({ vida: "" })
    expect(result.current.identityNameField?.key).toBe("nome")
    expect(result.current.assignablePlayerOptions).toEqual([
      { value: "user-1", label: "Ana (@ana)" }
    ])
    expect(deps.gateway.fetchBootstrap).not.toHaveBeenCalled()
  })

  it("mantem as mutacoes numericas e textuais fora do componente visual", async () => {
    const deps = createDependencies()
    const initialBootstrap = createBootstrap()
    const { result } = renderHook(() =>
      useCharacterEditorController({
        rpgId: "rpg-1",
        deps,
        initialBootstrap
      })
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.updateAttribute("forca", "12")
      result.current.updateStatus("vida", "30")
      result.current.updateIdentityField("nome", "Aria")
      result.current.updateCharacteristicsField("aparencia", "Cabelos azuis")
    })

    expect(result.current.values.forca).toBe(12)
    expect(result.current.statusValues.vida).toBe(30)
    expect(result.current.identityValues.nome).toBe("Aria")
    expect(result.current.characteristicsValues.aparencia).toBe("Cabelos azuis")
  })
})
