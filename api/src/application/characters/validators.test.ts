import { describe, expect, it } from "vitest"
import {
  isValidVisibility,
  validateCharacteristicsPayload,
  validateIdentityPayload,
  validateSkillsPayload,
  validateStatusesPayload,
} from "./validators"

describe("character validators", () => {
  it("rejeita status fora do template apos normalizacao de chave", () => {
    expect(
      validateStatusesPayload(
        {
          life: 10,
          focus: 3,
        },
        [{ key: "life", label: "Vida", position: 0 }],
      ),
    ).toEqual({
      ok: false,
      message: "Status fora do padrao: focus.",
    })
  })

  it("normaliza stamina para exhaustion", () => {
    expect(
      validateStatusesPayload(
        {
          stamina: 7,
        },
        [{ key: "exhaustion", label: "Exaustao", position: 0 }],
      ),
    ).toEqual({
      ok: true,
      value: {
        exhaustion: 7,
      },
    })
  })

  it("arredonda skills para baixo e mantem chaves do template", () => {
    expect(
      validateSkillsPayload(
        {
          pontaria: 4.9,
        },
        [{ key: "pontaria", label: "Pontaria", position: 0 }],
      ),
    ).toEqual({
      ok: true,
      value: {
        pontaria: 4,
      },
    })
  })

  it("valida visibilidade publica e privada", () => {
    expect(isValidVisibility("public")).toBe(true)
    expect(isValidVisibility("private")).toBe(true)
    expect(isValidVisibility("secret")).toBe(false)
  })

  it("compartilha a normalizacao de campos textuais templateados", () => {
    const template = [{ key: "nome", label: "Nome", required: true, position: 0 }]

    expect(
      validateIdentityPayload(
        {
          nome: "  Aria  ",
          apelido: "  A Guarda  ",
        },
        template,
      ),
    ).toEqual({
      ok: true,
      value: {
        nome: "Aria",
        apelido: "A Guarda",
      },
    })

    expect(
      validateCharacteristicsPayload(
        {
          nome: "  Feroz  ",
          origem: "  Floresta  ",
        },
        template,
      ),
    ).toEqual({
      ok: true,
      value: {
        nome: "Feroz",
        origem: "Floresta",
      },
    })
  })
})
