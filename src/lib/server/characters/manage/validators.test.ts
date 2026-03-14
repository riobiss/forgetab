import { describe, expect, it } from "vitest"
import {
  validateCharacteristicsPayload,
  validateIdentityPayload,
} from "./validators"

describe("manage validators", () => {
  it("preserva identidade livre de npc/criatura quando nao ha template", () => {
    expect(
      validateIdentityPayload(
        {
          nome: "Matador de leao brabo",
          "titulo-apelido": "O bravo",
          "raca-livre": "Humano",
          "classe-livre": "Cacador",
        },
        [],
      ),
    ).toEqual({
      ok: true,
      value: {
        nome: "Matador de leao brabo",
        "titulo-apelido": "O bravo",
        "raca-livre": "Humano",
        "classe-livre": "Cacador",
      },
    })
  })

  it("preserva caracteristicas livres de npc/criatura quando nao ha template", () => {
    expect(
      validateCharacteristicsPayload(
        {
          descricao: "Muito perigoso",
          "status-narrativo": "vivo",
          origem: "Selva",
        },
        [],
      ),
    ).toEqual({
      ok: true,
      value: {
        descricao: "Muito perigoso",
        "status-narrativo": "vivo",
        origem: "Selva",
      },
    })
  })
})
