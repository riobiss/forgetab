import { describe, expect, it } from "vitest"
import {
  deleteEntityCatalogCategory,
  getEntityCatalogCategoryDrafts,
  updateEntityCatalogCategory
} from "@/features/world/catalog/application/use-cases/manageEntityCatalogCategory"

const collection = [
  { id: "1", key: "mago", label: "Mago", category: "arcana" },
  { id: "2", key: "bruxo", label: "Bruxo", category: "arcana" },
  { id: "3", key: "soldado", label: "Soldado", category: "marcial" }
]

describe("manageEntityCatalogCategory", () => {
  it("cria drafts estáveis apenas para a categoria selecionada", () => {
    expect(getEntityCatalogCategoryDrafts(collection, "arcana")).toEqual([
      { identity: "id:1", label: "Mago" },
      { identity: "id:2", label: "Bruxo" }
    ])
  })

  it("renomeia a categoria, edita itens e remove drafts excluídos", () => {
    expect(
      updateEntityCatalogCategory(collection, {
        currentCategory: "arcana",
        nextCategory: "magia",
        items: [{ identity: "id:1", label: "Arquimago" }]
      })
    ).toEqual([
      { id: "1", key: "mago", label: "Arquimago", category: "magia" },
      { id: "3", key: "soldado", label: "Soldado", category: "marcial" }
    ])
  })

  it("remove todos os itens de uma categoria", () => {
    expect(deleteEntityCatalogCategory(collection, "arcana")).toEqual([
      { id: "3", key: "soldado", label: "Soldado", category: "marcial" }
    ])
  })
})
