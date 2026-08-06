import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import EntityCatalogGroups from "@/features/world/catalog/presentation/EntityCatalogGroups"

const groups = [
  {
    key: "arcana",
    label: "arcana",
    count: 1,
    items: [
      {
        id: "class-1",
        slug: "mago",
        name: "Mago",
        category: "arcana",
        meta: { shortDescription: "Domina magia", richText: {} },
        href: "/rpg/rpg-1/classes/class-1",
        entityType: "class" as const
      }
    ]
  }
]

describe("EntityCatalogGroups", () => {
  it("mantém controles irmãos e expõe o estado de expansão", async () => {
    const user = userEvent.setup()
    const onToggleGroup = vi.fn()
    const onManageCategory = vi.fn()
    const { container } = render(
      <EntityCatalogGroups
        groups={groups}
        collapsedGroups={{ arcana: false }}
        canManage
        onToggleGroup={onToggleGroup}
        onManageCategory={onManageCategory}
      />
    )

    expect(container.querySelector("button button")).toBeNull()
    const toggle = screen.getByRole("button", { expanded: true })
    await user.click(toggle)
    expect(onToggleGroup).toHaveBeenCalledWith("arcana")

    await user.click(
      screen.getByRole("button", { name: "Gerenciar categoria arcana" })
    )
    expect(onManageCategory).toHaveBeenCalledWith("arcana")
  })
})
