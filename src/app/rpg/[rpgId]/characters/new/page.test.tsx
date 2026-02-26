import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  searchCharacterId: null as string | null,
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({ rpgId: "rpg-1" }),
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "characterId" ? mocks.searchCharacterId : null),
  }),
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("@/components/select/NativeSelectField", () => ({
  NativeSelectField: ({
    value,
    onChange,
    children,
  }: {
    value?: string
    onChange?: (event: { target: { value: string } }) => void
    children: ReactNode
  }) => (
    <select
      value={value}
      onChange={(event) => onChange?.({ target: { value: event.target.value } })}
    >
      {children}
    </select>
  ),
}))

import NewCharacterPage from "./page"

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )
}

describe("NewCharacterPage", () => {
  let shouldFailCreate = false
  let shouldFailUpdate = false
  let shouldFailUpload = false
  let uploadImageUrl = "https://img.example.com/characters/c1.png"
  let rpgCanManage = false
  let rpgUseRaceBonuses = false
  let rpgUseClassBonuses = false
  let raceTemplates: Array<{ key: string; label: string; position: number }> = []
  let classTemplates: Array<{ key: string; label: string; position: number }> = []

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.searchCharacterId = null
    shouldFailCreate = false
    shouldFailUpdate = false
    shouldFailUpload = false
    uploadImageUrl = "https://img.example.com/characters/c1.png"
    rpgCanManage = false
    rpgUseRaceBonuses = false
    rpgUseClassBonuses = false
    raceTemplates = []
    classTemplates = []

    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString()
      const method = init?.method ?? "GET"

      if (url === "/api/rpg/rpg-1/attributes") {
        return jsonResponse({
          attributes: [{ key: "forca", label: "Forca", position: 1 }],
        })
      }
      if (url === "/api/rpg/rpg-1/statuses") {
        return jsonResponse({
          statuses: [{ key: "vida", label: "Vida", position: 1 }],
        })
      }
      if (url === "/api/rpg/rpg-1/skills") {
        return jsonResponse({
          skills: [{ key: "atletismo", label: "Atletismo", position: 1 }],
        })
      }
      if (url === "/api/rpg/rpg-1/characters" && method === "GET") {
        return jsonResponse({
          characters: [
            {
              id: "c1",
              name: "Uther",
              image: null,
              raceKey: "humano",
              classKey: "guerreiro",
              characterType: "player",
              visibility: "public",
              statuses: { vida: 12 },
              attributes: { forca: 8 },
              skills: { atletismo: 2 },
              progressionCurrent: 0,
            },
          ],
        })
      }
      if (url === "/api/rpg/rpg-1") {
        return jsonResponse({
          rpg: {
            useRaceBonuses: rpgUseRaceBonuses,
            useClassBonuses: rpgUseClassBonuses,
            useClassRaceBonuses: false,
            useInventoryWeightLimit: false,
            progressionMode: "xp_level",
            progressionTiers: [],
            canManage: rpgCanManage,
          },
        })
      }
      if (url === "/api/rpg/rpg-1/races") {
        return jsonResponse({ races: raceTemplates })
      }
      if (url === "/api/rpg/rpg-1/classes") {
        return jsonResponse({ classes: classTemplates })
      }
      if (url === "/api/rpg/rpg-1/character-identity") {
        return jsonResponse({ fields: [] })
      }
      if (url === "/api/rpg/rpg-1/character-characteristics") {
        return jsonResponse({ fields: [] })
      }
      if (url === "/api/rpg/rpg-1/characters" && method === "POST") {
        if (shouldFailCreate) {
          return jsonResponse({ message: "Nao foi possivel criar personagem." }, 400)
        }
        return jsonResponse({ id: "c1" }, 201)
      }
      if (url === "/api/uploads/character-image" && method === "POST") {
        if (shouldFailUpload) {
          return jsonResponse({ message: "Nao foi possivel enviar imagem." }, 502)
        }
        return jsonResponse({ url: uploadImageUrl }, 201)
      }
      if (url === "/api/rpg/rpg-1/characters/c1" && method === "PATCH") {
        if (shouldFailUpdate) {
          return jsonResponse({ message: "Nao foi possivel atualizar personagem." }, 400)
        }
        return jsonResponse({ id: "c1" }, 200)
      }

      return jsonResponse({ message: `Unhandled URL: ${url} (${method})` }, 500)
    }) as typeof fetch
  })

  it("cria personagem e redireciona para a lista", async () => {
    const user = userEvent.setup()

    render(<NewCharacterPage />)

    const submitButton = await screen.findByRole("button", { name: "Criar personagem" })
    await waitFor(() => expect(submitButton).toBeEnabled())

    const nomeInput = screen.getByLabelText("Nome")
    await user.type(nomeInput, "Arthas")
    await user.click(submitButton)

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/rpg/rpg-1/characters")
      expect(mocks.refresh).toHaveBeenCalled()
    })

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url === "/api/rpg/rpg-1/characters" && init?.method === "POST",
    )
    expect(postCall).toBeTruthy()
    expect(postCall?.[1]?.body).toContain('"name":"Arthas"')
  })

  it("exibe erro quando a criacao falha e nao redireciona", async () => {
    shouldFailCreate = true
    const user = userEvent.setup()

    render(<NewCharacterPage />)

    const submitButton = await screen.findByRole("button", { name: "Criar personagem" })
    await waitFor(() => expect(submitButton).toBeEnabled())

    const nomeInput = screen.getByLabelText("Nome")
    await user.type(nomeInput, "Jaina")
    await user.click(submitButton)

    expect(await screen.findByText("Nao foi possivel criar personagem.")).toBeInTheDocument()
    expect(mocks.push).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it("edita personagem e envia PATCH com redirecionamento", async () => {
    mocks.searchCharacterId = "c1"
    const user = userEvent.setup()

    render(<NewCharacterPage />)

    expect(await screen.findByRole("heading", { name: "Editar Personagem" })).toBeInTheDocument()

    const nomeInput = screen.getByLabelText("Nome")
    await user.clear(nomeInput)
    await user.type(nomeInput, "Thrall")
    await user.click(screen.getByRole("button", { name: "Salvar personagem" }))

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/rpg/rpg-1/characters")
      expect(mocks.refresh).toHaveBeenCalled()
    })

    const patchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url === "/api/rpg/rpg-1/characters/c1" && init?.method === "PATCH",
    )
    expect(patchCall).toBeTruthy()
    expect(patchCall?.[1]?.body).toContain('"name":"Thrall"')
  })

  it("permite editar pericias na edicao quando usuario pode gerenciar RPG", async () => {
    mocks.searchCharacterId = "c1"
    rpgCanManage = true
    const user = userEvent.setup()

    render(<NewCharacterPage />)

    expect(await screen.findByRole("heading", { name: "Editar Personagem" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Pericias" })).toBeInTheDocument()

    const atletismoInput = screen.getByLabelText("Atletismo")
    await user.clear(atletismoInput)
    await user.type(atletismoInput, "5")
    await user.click(screen.getByRole("button", { name: "Salvar personagem" }))

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/rpg/rpg-1/characters")
      expect(mocks.refresh).toHaveBeenCalled()
    })

    const patchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url === "/api/rpg/rpg-1/characters/c1" && init?.method === "PATCH",
    )
    expect(patchCall).toBeTruthy()
    const patchBody = JSON.parse(String(patchCall?.[1]?.body)) as {
      skills?: Record<string, number>
    }
    expect(patchBody.skills).toEqual({ atletismo: 5 })
  })

  it("permite moderador editar raca e classe na edicao", async () => {
    mocks.searchCharacterId = "c1"
    rpgCanManage = true
    rpgUseRaceBonuses = true
    rpgUseClassBonuses = true
    raceTemplates = [{ key: "humano", label: "Humano", position: 1 }, { key: "elfo", label: "Elfo", position: 2 }]
    classTemplates = [{ key: "guerreiro", label: "Guerreiro", position: 1 }, { key: "mago", label: "Mago", position: 2 }]
    const user = userEvent.setup()

    render(<NewCharacterPage />)

    expect(await screen.findByRole("heading", { name: "Editar Personagem" })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText("Raca"), "elfo")
    await user.selectOptions(screen.getByLabelText("Classe"), "mago")
    await user.click(screen.getByRole("button", { name: "Salvar personagem" }))

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/rpg/rpg-1/characters")
    })

    const patchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url === "/api/rpg/rpg-1/characters/c1" && init?.method === "PATCH",
    )
    expect(patchCall).toBeTruthy()
    const patchBody = JSON.parse(String(patchCall?.[1]?.body)) as {
      raceKey?: string
      classKey?: string
    }
    expect(patchBody.raceKey).toBe("elfo")
    expect(patchBody.classKey).toBe("mago")
  })

  it("faz upload de imagem antes de criar personagem", async () => {
    const user = userEvent.setup()

    render(<NewCharacterPage />)

    const submitButton = await screen.findByRole("button", { name: "Criar personagem" })
    await waitFor(() => expect(submitButton).toBeEnabled())

    const nomeInput = screen.getByLabelText("Nome")
    await user.type(nomeInput, "Illidan")

    const fileInput = screen.getByLabelText("Selecionar imagem")
    const file = new File(["binary-image"], "avatar.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await user.click(submitButton)

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/rpg/rpg-1/characters")
    })

    const uploadCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url === "/api/uploads/character-image" && init?.method === "POST",
    )
    expect(uploadCall).toBeTruthy()
    expect(uploadCall?.[1]?.body).toBeInstanceOf(FormData)

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url === "/api/rpg/rpg-1/characters" && init?.method === "POST",
    )
    expect(postCall).toBeTruthy()
    expect(postCall?.[1]?.body).toContain(`"image":"${uploadImageUrl}"`)
  })

  it("exibe erro e nao cria personagem quando upload falha", async () => {
    shouldFailUpload = true
    const user = userEvent.setup()

    render(<NewCharacterPage />)

    const submitButton = await screen.findByRole("button", { name: "Criar personagem" })
    await waitFor(() => expect(submitButton).toBeEnabled())

    const nomeInput = screen.getByLabelText("Nome")
    await user.type(nomeInput, "Malfurion")

    const fileInput = screen.getByLabelText("Selecionar imagem")
    const file = new File(["binary-image"], "avatar.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await user.click(submitButton)

    const uploadErrors = await screen.findAllByText("Nao foi possivel enviar imagem.")
    expect(uploadErrors.length).toBeGreaterThan(0)
    expect(mocks.push).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()

    const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url === "/api/rpg/rpg-1/characters" && init?.method === "POST",
    )
    expect(postCall).toBeFalsy()
  })
})
