import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  loadRpgEditorBootstrapUseCase: vi.fn(),
  saveRpgRacesUseCase: vi.fn(),
  saveRpgClassesUseCase: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}))

vi.mock("@/presentation/rpg-editor/dependencies", () => ({
  createRpgEditorDependencies: () => ({ gateway: {} }),
}))

vi.mock("@/application/rpgEditor/use-cases/rpgEditor", () => ({
  loadRpgEditorBootstrapUseCase: mocks.loadRpgEditorBootstrapUseCase,
  saveRpgRacesUseCase: mocks.saveRpgRacesUseCase,
  saveRpgClassesUseCase: mocks.saveRpgClassesUseCase,
}))

import { useAdvancedIdentityEditor } from "@/presentation/rpg-editor/edit/advanced/useAdvancedIdentityEditor"

function createBootstrap() {
  return {
    rpg: { canManage: true },
    attributes: [{ key: "str", label: "Forca" }],
    skills: [{ key: "fight", label: "Luta" }],
    races: [
      {
        key: "elfo",
        label: "Elfo",
        category: "geral",
        attributeBonuses: { str: 1 },
        skillBonuses: { fight: 2 },
        lore: undefined,
        catalogMeta: undefined,
      },
    ],
    classes: [
      {
        key: "mago",
        label: "Mago",
        category: "geral",
        attributeBonuses: { str: 0 },
        skillBonuses: { fight: 1 },
        catalogMeta: undefined,
      },
    ],
    statuses: [],
    identityFields: [],
    characteristicFields: [],
  }
}

describe("useAdvancedIdentityEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.loadRpgEditorBootstrapUseCase.mockResolvedValue(createBootstrap())
    mocks.saveRpgRacesUseCase.mockResolvedValue(undefined)
    mocks.saveRpgClassesUseCase.mockResolvedValue(undefined)
  })

  it("carrega draft existente para race", async () => {
    const { result } = renderHook(() =>
      useAdvancedIdentityEditor({
        rpgId: "rpg-1",
        type: "race",
        templateKey: "elfo",
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.draft?.label).toBe("Elfo")
    expect(result.current.attributeTemplates).toEqual([{ key: "str", label: "Forca" }])
    expect(result.current.skillTemplates).toEqual([{ key: "fight", label: "Luta" }])
  })

  it("salva race e navega de volta para edit", async () => {
    const { result } = renderHook(() =>
      useAdvancedIdentityEditor({
        rpgId: "rpg-1",
        type: "race",
        templateKey: "elfo",
      }),
    )

    await waitFor(() => {
      expect(result.current.draft?.label).toBe("Elfo")
    })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(mocks.saveRpgRacesUseCase).toHaveBeenCalledTimes(1)
    expect(mocks.push).toHaveBeenCalledWith("/rpg/rpg-1/edit")
    expect(mocks.refresh).toHaveBeenCalledTimes(1)
  })
})
