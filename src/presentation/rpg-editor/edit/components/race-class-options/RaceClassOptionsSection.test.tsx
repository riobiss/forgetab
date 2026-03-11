import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RpgEditorDependencies } from "@/application/rpgEditor/contracts/RpgEditorDependencies"

const mocks = vi.hoisted(() => ({
  saveRpgRacesUseCase: vi.fn(),
  saveRpgClassesUseCase: vi.fn(),
}))

vi.mock("@/application/rpgEditor/use-cases/rpgEditor", () => ({
  saveRpgRacesUseCase: mocks.saveRpgRacesUseCase,
  saveRpgClassesUseCase: mocks.saveRpgClassesUseCase,
}))

const deps = { gateway: {} } as unknown as RpgEditorDependencies

describe("RaceClassOptionsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true))
  })

  it("remove race usando use-case e atualiza lista", async () => {
    const onRaceDraftsChange = vi.fn()
    mocks.saveRpgRacesUseCase.mockResolvedValue(undefined)

    const { default: RaceClassOptionsSection } = await import(
      "@/presentation/rpg-editor/edit/components/race-class-options/RaceClassOptionsSection"
    )

    render(
      <RaceClassOptionsSection
        deps={deps}
        rpgId="rpg-1"
        showRaceList
        onToggleRaceList={vi.fn()}
        onCreateRace={vi.fn()}
        raceDrafts={[
          {
            key: "elfo",
            label: "Elfo",
            position: 0,
            category: "geral",
            attributeBonuses: { str: 1 },
            skillBonuses: { fight: 2 },
          },
        ]}
        onRaceDraftsChange={onRaceDraftsChange}
        showClassList={false}
        onToggleClassList={vi.fn()}
        onCreateClass={vi.fn()}
        classDrafts={[]}
        onClassDraftsChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Excluir/i }))

    await waitFor(() => {
      expect(mocks.saveRpgRacesUseCase).toHaveBeenCalledTimes(1)
    })
    expect(onRaceDraftsChange).toHaveBeenCalledWith([])
    expect(screen.getByText("Raca excluida com sucesso.")).toBeInTheDocument()
  })

  it("remove class usando use-case e atualiza lista", async () => {
    const onClassDraftsChange = vi.fn()
    mocks.saveRpgClassesUseCase.mockResolvedValue(undefined)

    const { default: RaceClassOptionsSection } = await import(
      "@/presentation/rpg-editor/edit/components/race-class-options/RaceClassOptionsSection"
    )

    render(
      <RaceClassOptionsSection
        deps={deps}
        rpgId="rpg-1"
        showRaceList={false}
        onToggleRaceList={vi.fn()}
        onCreateRace={vi.fn()}
        raceDrafts={[]}
        onRaceDraftsChange={vi.fn()}
        showClassList
        onToggleClassList={vi.fn()}
        onCreateClass={vi.fn()}
        classDrafts={[
          {
            key: "mago",
            label: "Mago",
            position: 0,
            category: "geral",
            attributeBonuses: { str: 0 },
            skillBonuses: { fight: 1 },
          },
        ]}
        onClassDraftsChange={onClassDraftsChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Excluir/i }))

    await waitFor(() => {
      expect(mocks.saveRpgClassesUseCase).toHaveBeenCalledTimes(1)
    })
    expect(onClassDraftsChange).toHaveBeenCalledWith([])
    expect(screen.getByText("Classe excluida com sucesso.")).toBeInTheDocument()
  })
})
