import { fireEvent, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { MapSectionDetailsModal } from "@/presentation/rpg-map/components/MapSectionDetailsModal"

describe("MapSectionDetailsModal", () => {
  it("renderiza detalhes, breadcrumbs e aciona editar/fechar", () => {
    const onOpenBreadcrumb = vi.fn()
    const onEdit = vi.fn()
    const onClose = vi.fn()

    render(
      <MapSectionDetailsModal
        isOpen
        modalRef={createRef<HTMLElement>()}
        selectedSection={{
          id: "section-1",
          mapId: "map-1",
          rpgId: "rpg-1",
          parentSectionId: null,
          name: "Capital",
          description: "Descricao original",
          type: "city",
          order: 0,
          customFields: null,
          canEdit: true,
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
        breadcrumbs={[
          { id: "parent-1", label: "Reino" },
          { id: "section-1", label: "Capital" },
        ]}
        sectionRenderState={{
          name: "Capital Vinculada",
          description: "Centro politico",
          type: "city",
          customFields: [["Clima", { value: "Frio", type: "text" }]],
        }}
        onOpenBreadcrumb={onOpenBreadcrumb}
        onEdit={onEdit}
        onClose={onClose}
      />,
    )

    expect(screen.getByRole("dialog", { name: "Detalhes da secao" })).toBeInTheDocument()
    expect(screen.getByText("Capital Vinculada")).toBeInTheDocument()
    expect(screen.getByText("Centro politico")).toBeInTheDocument()
    expect(screen.getByText("Clima")).toBeInTheDocument()
    expect(screen.getByText("Frio")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Reino" }))
    fireEvent.click(screen.getByRole("button", { name: /Fechar detalhes da secao/i }))
    fireEvent.click(screen.getAllByRole("button")[0])

    expect(onOpenBreadcrumb).toHaveBeenCalledWith("parent-1")
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "section-1",
      }),
    )
  })

  it("nao renderiza o botao de editar quando a secao nao pode editar", () => {
    render(
      <MapSectionDetailsModal
        isOpen
        modalRef={createRef<HTMLElement>()}
        selectedSection={{
          id: "section-1",
          mapId: "map-1",
          rpgId: "rpg-1",
          parentSectionId: null,
          name: "Capital",
          description: null,
          type: null,
          order: 0,
          customFields: null,
          canEdit: false,
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
        breadcrumbs={[]}
        sectionRenderState={null}
        onOpenBreadcrumb={vi.fn()}
        onEdit={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText("Capital")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Fechar detalhes da secao/i })).toBeInTheDocument()
    expect(screen.queryAllByRole("button")).toHaveLength(1)
  })

  it("renderiza campos do tipo link como link clicavel", () => {
    render(
      <MapSectionDetailsModal
        isOpen
        modalRef={createRef<HTMLElement>()}
        selectedSection={{
          id: "section-1",
          mapId: "map-1",
          rpgId: "rpg-1",
          parentSectionId: null,
          name: "Capital",
          description: null,
          type: null,
          order: 0,
          customFields: null,
          canEdit: false,
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        }}
        breadcrumbs={[]}
        sectionRenderState={{
          name: "Capital",
          description: null,
          type: null,
          customFields: [["Wiki", { value: "https://wiki.local/capital", type: "link" }]],
        }}
        onOpenBreadcrumb={vi.fn()}
        onEdit={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole("link", { name: "https://wiki.local/capital" })).toHaveAttribute(
      "href",
      "https://wiki.local/capital",
    )
  })
})
