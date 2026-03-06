import { revalidateTag } from "next/cache"

export function buildItemsListUserTag(userId: string) {
  return `items-list:user:${userId}`
}

export function buildItemsListRpgTag(userId: string, rpgId: string) {
  return `items-list:user:${userId}:rpg:${rpgId}`
}

export function buildItemsListTagList(params: { userId: string; rpgId?: string | null }) {
  const tags = [buildItemsListUserTag(params.userId)]
  if (params.rpgId) {
    tags.push(buildItemsListRpgTag(params.userId, params.rpgId))
  }
  return tags
}

export function revalidateItemsListTags(params: { userId: string; rpgId?: string | null }) {
  for (const tag of buildItemsListTagList(params)) {
    try {
      revalidateTag(tag, "max")
    } catch {
      // Ambiente sem cache incremental (ex.: testes).
    }
  }
}
