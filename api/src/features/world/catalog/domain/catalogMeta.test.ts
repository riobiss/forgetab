import { describe, expect, it } from "vitest"
import {
  normalizeEntityCatalogMeta,
  serializeEntityCatalogMeta
} from "@/features/world/catalog/domain/catalogMeta"

describe("catalogMeta", () => {
  it("normaliza texto e mantém apenas documentos rich text válidos", () => {
    expect(
      normalizeEntityCatalogMeta({
        shortDescription: "  Resumo  ",
        richText: {
          description: { type: "doc", content: [] },
          lore: { type: "paragraph", content: [] },
          notes: { type: "doc", content: "invalido" },
          unknown: { type: "doc", content: [] }
        }
      })
    ).toEqual({
      shortDescription: "Resumo",
      richText: { description: { type: "doc", content: [] } }
    })
  })

  it("serializa uma cópia sanitizada do metadado", () => {
    expect(
      serializeEntityCatalogMeta({
        shortDescription: "  Texto  ",
        richText: {
          description: { type: "doc", content: [] },
          notes: null
        }
      })
    ).toEqual({
      shortDescription: "Texto",
      richText: { description: { type: "doc", content: [] } }
    })
  })
})
