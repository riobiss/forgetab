import { describe, expect, it } from "vitest"
import {
  buildNpcMonsterBasicUpdatePayload,
  getNpcMonsterSecretFieldKeys,
  readNpcMonsterBasicDraft,
} from "./npcMonsterSchema"

describe("npcMonsterSchema", () => {
  it("le o draft basico de npc a partir do snapshot do personagem", () => {
    const draft = readNpcMonsterBasicDraft({
      id: "char-1",
      name: "Goblin",
      image: null,
      characterType: "npc",
      visibility: "private",
      raceKey: null,
      classKey: null,
      identity: {
        nome: "Goblin",
        alcunha: "Ladrao",
        "raca-livre": "Fada sombria",
        "classe-livre": "Batedor",
      },
      characteristics: {
        descricao: "Pequeno e agil",
        "status-narrativo": "desaparecido",
        origem: "Bosque velho",
      },
    })

    expect(draft).toEqual({
      name: "Goblin",
      titleNickname: "Ladrao",
      description: "Pequeno e agil",
      visibility: "private",
      narrativeStatus: "desaparecido",
      secretFieldKeys: [],
      raceLabel: "Fada sombria",
      classLabel: "Batedor",
      image: "",
      extraFields: [{ key: "origem", value: "Bosque velho" }],
    })
  })

  it("monta o payload basico com schema explicita de npc", () => {
    const payload = buildNpcMonsterBasicUpdatePayload({
      currentCharacter: {
        id: "char-1",
        name: "Goblin",
        image: null,
        characterType: "npc",
        visibility: "public",
        raceKey: null,
        classKey: null,
      identity: {
        nome: "Goblin",
        apelido: "Antigo",
        "titulo-apelido": "Antigo legado",
      },
        characteristics: {
          descricao: "Velho",
          "status-narrativo": "vivo",
          origem: "Caverna",
        },
      },
      basic: {
        name: "Goblin",
        titleNickname: "Chefe",
        description: "Novo lider",
        visibility: "public",
        narrativeStatus: "vivo",
        secretFieldKeys: [],
        raceLabel: "Orco",
        classLabel: "Guardiao",
        image: "",
        extraFields: [{ key: "origem", value: "Forte norte" }],
      },
    })

    expect(payload).toEqual({
      name: "Goblin",
      image: null,
      visibility: "public",
      identity: {
        nome: "Goblin",
        apelido: "Chefe",
        alcunha: "Chefe",
        "raca-livre": "Orco",
        "classe-livre": "Guardiao",
      },
      characteristics: {
        descricao: "Novo lider",
        "status-narrativo": "vivo",
        origem: "Forte norte",
      },
    })
  })

  it("persiste e le os campos secretos do status secreto", () => {
    const payload = buildNpcMonsterBasicUpdatePayload({
      currentCharacter: null,
      basic: {
        name: "Esfinge",
        titleNickname: "Ancestral",
        description: "Guarda os portoes",
        visibility: "public",
        narrativeStatus: "secreto",
        secretFieldKeys: ["name", "classLabel", "extra:origem"],
        raceLabel: "Bestial",
        classLabel: "Guardia",
        image: "",
        extraFields: [{ key: "origem", value: "Deserto" }],
      },
    })

    expect(getNpcMonsterSecretFieldKeys(payload.characteristics)).toEqual([
      "name",
      "classLabel",
      "extra:origem",
    ])
  })
})
