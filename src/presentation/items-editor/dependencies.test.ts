import { describe, expect, it } from "vitest"
import { httpItemsEditorGateway } from "@/infrastructure/itemsEditor/gateways/httpItemsEditorGateway"
import { createItemsEditorDependencies } from "@/presentation/items-editor/dependencies"

describe("createItemsEditorDependencies", () => {
  it("retorna gateway http por padrao", () => {
    const deps = createItemsEditorDependencies()
    expect(deps.gateway).toBe(httpItemsEditorGateway)
  })

  it("retorna gateway http quando factory e explicitamente http", () => {
    const deps = createItemsEditorDependencies("http")
    expect(deps.gateway).toBe(httpItemsEditorGateway)
  })
})
