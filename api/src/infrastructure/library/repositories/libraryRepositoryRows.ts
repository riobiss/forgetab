import type { Prisma } from "../../../../generated/prisma/client.js"

export type LibrarySectionRow = {
  id: string
  rpgId: string
  createdByUserId: string | null
  title: string
  description: string | null
  visibility: "private" | "public"
  createdAt: Date
  updatedAt: Date
  booksCount: number
}

export type LibraryBookRow = {
  id: string
  rpgId: string
  sectionId: string
  createdByUserId: string | null
  title: string
  description: string | null
  content: Prisma.JsonValue
  visibility: "private" | "public" | "unlisted"
  allowedCharacterIds: Prisma.JsonValue
  allowedClassKeys: Prisma.JsonValue
  allowedRaceKeys: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}
