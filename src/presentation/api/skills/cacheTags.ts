import { revalidateTag } from "next/cache"

export function buildSkillsIndexUserTag(userId: string) {
  return `skills-index:user:${userId}`
}

export function buildSkillsIndexRpgTag(userId: string, rpgId: string) {
  return `skills-index:user:${userId}:rpg:${rpgId}`
}

export function buildSkillsIndexTagList(params: { userId: string; rpgId?: string | null }) {
  const tags = [buildSkillsIndexUserTag(params.userId)]
  if (params.rpgId) {
    tags.push(buildSkillsIndexRpgTag(params.userId, params.rpgId))
  }
  return tags
}

export function revalidateSkillsIndexTags(params: { userId: string; rpgId?: string | null }) {
  for (const tag of buildSkillsIndexTagList(params)) {
    try {
      revalidateTag(tag, "max")
    } catch {
      // Ambiente sem cache incremental (ex.: testes).
    }
  }
}
