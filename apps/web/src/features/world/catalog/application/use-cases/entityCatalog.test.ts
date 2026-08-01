import { describe, expect, it } from "vitest"
import type { EntityCatalogItem } from "@/features/world/catalog/application/types"
import {
  buildEntityCatalogGroups,
  getEntityCatalogCategoryOptions,
  searchCatalogItems,
} from "@/features/world/catalog/application/use-cases/entityCatalog"

const items: EntityCatalogItem[] = [
  {
    id: "2",
    slug: "mago",
    name: "Mago",
    category: "arcana",
    meta: { shortDescription: "Domina magia", richText: {} },
    href: "/mago",
    entityType: "class",
  },
  {
    id: "1",
    slug: "guerreiro",
    name: "Guerreiro",
    category: "marcial",
    meta: {
      shortDescription: null,
      richText: {
        description: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Proteção pesada" }],
            },
          ],
        },
      },
    },
    href: "/guerreiro",
    entityType: "class",
  },
]

describe("entityCatalog filters", () => {
  it("busca sem diferenciar acentos", () => {
    expect(searchCatalogItems(items, "protecao")).toEqual([items[1]])
  })

  it("filtra, ordena e agrupa sem alterar a coleção original", () => {
    const result = buildEntityCatalogGroups(items, {
      search: "",
      category: "all",
      sort: "name-asc",
    })

    expect(result.map((group) => group.key)).toEqual(["arcana", "marcial"])
    expect(items.map((item) => item.name)).toEqual(["Mago", "Guerreiro"])
  })

  it("retorna categorias únicas em ordem alfabética", () => {
    expect(getEntityCatalogCategoryOptions([...items, items[0]])).toEqual([
      "arcana",
      "marcial",
    ])
  })
})
