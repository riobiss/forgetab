import { describe, expect, it } from "vitest"
import {
  buildCreatureIdentityPayload,
  buildCreatureRowsFromCharacter,
  buildCreatureRowsFromTemplates,
  createCreatureTemplateCategory,
  createCreatureTemplateField,
  findCreatureTemplateRow,
  groupCreatureIdentity,
  updateCreatureTemplateField,
  type CreatureTemplateCategoryDto,
} from "@/application/creatures"

const categories: CreatureTemplateCategoryDto[] = [
  {
    id: "cat-appearance",
    key: "aparencia",
    label: "Aparencia",
    position: 0,
    fields: [
      { id: "field-size", key: "tamanho", label: "Tamanho", fieldType: "text", position: 0 },
      { id: "field-level", key: "nivel", label: "Nivel", fieldType: "number", position: 1 },
    ],
  },
]

describe("creature template utils", () => {
  it("cria categorias com key unica a partir do nome", () => {
    const result = createCreatureTemplateCategory(categories, "Aparencia")

    expect(result.categoryKey).toBe("aparencia-2")
    expect(result.categories.at(-1)).toMatchObject({
      key: "aparencia-2",
      label: "Aparencia",
      fields: [],
    })
  })

  it("cria chave na categoria mantendo tipo texto como padrao", () => {
    const result = createCreatureTemplateField(categories, "aparencia", "Nivel")

    expect(result.fieldKey).toBe("nivel-2")
    expect(result.categories[0].fields.at(-1)).toMatchObject({
      key: "nivel-2",
      label: "Nivel",
      fieldType: "text",
      position: 2,
    })
  })

  it("atualiza nome e tipo de uma chave", () => {
    const result = updateCreatureTemplateField(categories, {
      categoryKey: "aparencia",
      fieldId: "field-size",
      label: "Altura",
      fieldType: "number",
    })

    expect(result[0].fields[0]).toMatchObject({
      id: "field-size",
      key: "tamanho",
      label: "Altura",
      fieldType: "number",
    })
  })

  it("monta linhas de edicao a partir dos templates e valores existentes", () => {
    const existingRows = buildCreatureRowsFromCharacter({
      id: "creature-1",
      name: "Lobo",
      characterType: "creature",
      visibility: "public",
      identity: {
        "aparencia::tamanho": "Medio",
        "extra::habitat": "Floresta",
      },
    })

    const rows = buildCreatureRowsFromTemplates(categories, existingRows)

    expect(findCreatureTemplateRow(rows, "aparencia", "tamanho")?.value).toBe("Medio")
    expect(findCreatureTemplateRow(rows, "aparencia", "nivel")?.value).toBe("")
    expect(findCreatureTemplateRow(rows, "extra", "habitat")?.value).toBe("Floresta")
  })

  it("gera payload de identity e agrupamento de detalhe", () => {
    const rows = [
      { id: "row-1", categoryKey: "aparencia", fieldKey: "tamanho", value: "Medio" },
      { id: "row-2", categoryKey: "aparencia", fieldKey: "nivel", value: "3" },
      { id: "row-3", categoryKey: "aparencia", fieldKey: "vazio", value: "" },
    ]

    expect(buildCreatureIdentityPayload(rows)).toEqual({
      "aparencia::tamanho": "Medio",
      "aparencia::nivel": "3",
    })
    expect(groupCreatureIdentity(rows, categories)).toEqual([
      {
        categoryKey: "aparencia",
        categoryLabel: "Aparencia",
        items: [
          { key: "tamanho", label: "Tamanho", value: "Medio" },
          { key: "nivel", label: "Nivel", value: "3" },
        ],
      },
    ])
  })
})
