import { beforeEach, describe, expect, it } from "vitest"
import { LEGACY_NOTES_PREFIX, legacyNotesSource } from "./legacyNotesSource"
import {
  NOTES_CACHE_PREFIX,
  notesCacheRepository
} from "./notesCacheRepository"

const scope = { rpgId: "rpg-1", userId: "user-1" }

describe("notesCacheRepository", () => {
  beforeEach(() => window.localStorage.clear())

  it("mantem notas pendentes isoladas por campanha e usuario", () => {
    const note = {
      id: "note-1",
      clientId: "client-1",
      localKey: "client:client-1",
      title: "Pistas",
      content: "Conteudo local",
      labels: [],
      revision: 2,
      localVersion: 4,
      isNew: false,
      syncStatus: "pending" as const,
      createdAt: "2026-08-19T10:00:00.000Z",
      updatedAt: "2026-08-19T10:01:00.000Z"
    }
    notesCacheRepository.save(scope, [note])
    expect(notesCacheRepository.load(scope)).toEqual([note])
    expect(
      notesCacheRepository.load({ rpgId: "rpg-2", userId: "user-1" })
    ).toEqual([])
    expect(
      window.localStorage.getItem(`${NOTES_CACHE_PREFIX}rpg-1:user-1`)
    ).toBeTruthy()
  })

  it("converte notas legadas com clientId deterministico", () => {
    window.localStorage.setItem(
      `${LEGACY_NOTES_PREFIX}rpg-1:user-1`,
      JSON.stringify([
        {
          id: "legacy-1",
          content: "Primeira linha\nDetalhes",
          createdAt: "2026-08-18T12:00:00.000Z"
        }
      ])
    )

    const firstRead = legacyNotesSource.load(scope)
    const secondRead = legacyNotesSource.load(scope)
    expect(firstRead).toEqual(secondRead)
    expect(firstRead[0]).toMatchObject({
      clientId: "legacy:rpg-1:user-1:legacy-1",
      title: "Primeira linha",
      content: "Primeira linha\nDetalhes",
      isNew: true,
      syncStatus: "pending"
    })
  })
})
