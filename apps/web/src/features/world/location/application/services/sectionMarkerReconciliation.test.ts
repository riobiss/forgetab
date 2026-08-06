import { describe, expect, it } from "vitest"
import {
  applyLinkedMarkerToPayload,
  findLinkedMarkerConflicts,
  type SectionMarkerLink,
  type SectionSavePayload
} from "./sectionMarkerReconciliation"

const marker: SectionMarkerLink = {
  id: "marker-1",
  groupId: "group-1",
  visibility: "public",
  name: "Cidade",
  location: "Norte",
  shortDescription: "Capital",
  image: "city.png",
  color: "#fff"
}

const section: SectionSavePayload = {
  name: "Vila",
  description: "Interior",
  type: "local",
  parentSectionId: null,
  customFields: {
    Localizacao: "Sul",
    Imagem: "village.png",
    Cor: "#000",
    Habitantes: "100"
  }
}

describe("sectionMarkerReconciliation", () => {
  it("identifica somente campos preenchidos e divergentes", () => {
    expect(findLinkedMarkerConflicts(section, marker)).toEqual([
      "Nome",
      "Descricao",
      "Localizacao",
      "Imagem",
      "Cor"
    ])

    expect(
      findLinkedMarkerConflicts(
        {
          ...section,
          name: "",
          description: null,
          customFields: { Habitantes: "100" }
        },
        marker
      )
    ).toEqual([])
  })

  it("aplica os dados do marcador e preserva campos sem relacao", () => {
    expect(applyLinkedMarkerToPayload(section, marker, "marker")).toEqual({
      ...section,
      name: "Cidade",
      description: "Capital",
      customFields: {
        Localizacao: "Norte",
        Imagem: "city.png",
        Cor: "#fff",
        Habitantes: "100",
        MarcadorId: "marker-1",
        MarcadorGrupoId: "group-1",
        MarcadorNome: "Cidade"
      }
    })
  })

  it("mantem dados da secao e preenche apenas valores ausentes", () => {
    expect(
      applyLinkedMarkerToPayload(
        {
          ...section,
          customFields: { Habitantes: "100" }
        },
        marker,
        "section"
      )
    ).toEqual({
      ...section,
      customFields: {
        Habitantes: "100",
        MarcadorId: "marker-1",
        MarcadorGrupoId: "group-1",
        MarcadorNome: "Cidade",
        Localizacao: "Norte",
        Imagem: "city.png",
        Cor: "#fff"
      }
    })
  })

  it("remove campos visuais quando o marcador preferido nao possui valor", () => {
    const result = applyLinkedMarkerToPayload(
      section,
      {
        ...marker,
        location: null,
        image: null,
        color: null
      },
      "marker"
    )

    expect(result.customFields).not.toHaveProperty("Localizacao")
    expect(result.customFields).not.toHaveProperty("Imagem")
    expect(result.customFields).not.toHaveProperty("Cor")
  })
})
