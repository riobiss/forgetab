import type { Prisma } from "../../../../../generated/prisma/client.js"

export type MapRow = {
  id: string
  rpgId: string
  createdByUserId: string | null
  title: string
  description: string | null
  type: string | null
  image: string | null
  order: number
  sectionsCount: number
  createdAt: Date
  updatedAt: Date
}

export type SectionRow = {
  id: string
  mapId: string
  rpgId: string
  parentSectionId: string | null
  createdByUserId: string | null
  name: string
  description: string | null
  type: string | null
  order: number
  customFields: Prisma.JsonValue | null
  createdAt: Date
  updatedAt: Date
}

export type MarkerGroupRow = {
  id: string
  mapId: string
  rpgId: string
  createdByUserId: string | null
  name: string
  color: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type MarkerRow = {
  id: string
  groupId: string
  mapId: string
  rpgId: string
  createdByUserId: string | null
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
  x: number
  y: number
  size: number | null
  pinStyle: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}
