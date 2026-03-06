import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpItemsEditorGateway } from "@/infrastructure/itemsEditor/gateways/httpItemsEditorGateway"

const mocks = vi.hoisted(() => ({
  formSpy: vi.fn(),
}))

vi.mock("@/presentation/items-editor/ItemEditorForm", () => ({
  default: (props: unknown) => {
    mocks.formSpy(props)
    return <div data-testid="item-editor-form" />
  },
}))

import ItemEditorFeature from "@/presentation/items-editor/ItemEditorFeature"

describe("ItemEditorFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("injeta deps no form com factory padrao", () => {
    render(<ItemEditorFeature rpgId="rpg-1" mode="create" />)

    expect(screen.getByTestId("item-editor-form")).toBeInTheDocument()
    expect(mocks.formSpy).toHaveBeenCalledTimes(1)

    const call = mocks.formSpy.mock.calls[0]?.[0] as {
      deps: { gateway: unknown }
      rpgId: string
      mode: "create" | "edit"
      itemId?: string
    }

    expect(call.rpgId).toBe("rpg-1")
    expect(call.mode).toBe("create")
    expect(call.itemId).toBeUndefined()
    expect(call.deps.gateway).toBe(httpItemsEditorGateway)
  })

  it("aceita factory explicita e props de edicao", () => {
    render(
      <ItemEditorFeature
        rpgId="rpg-1"
        mode="edit"
        itemId="item-1"
        gatewayFactory="http"
      />,
    )

    expect(mocks.formSpy).toHaveBeenCalledTimes(1)

    const call = mocks.formSpy.mock.calls[0]?.[0] as {
      deps: { gateway: unknown }
      mode: "create" | "edit"
      itemId?: string
    }

    expect(call.mode).toBe("edit")
    expect(call.itemId).toBe("item-1")
    expect(call.deps.gateway).toBe(httpItemsEditorGateway)
  })
})
