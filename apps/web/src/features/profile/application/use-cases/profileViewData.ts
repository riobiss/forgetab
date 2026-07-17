import type {
  ProfileRpgSummary,
  ProfileUserRecord,
  ProfileViewData,
} from "@/features/profile/application/types"

export function buildProfileRpgProfiles(
  user: ProfileUserRecord | null,
): ProfileRpgSummary[] {
  if (!user) {
    return []
  }

  const charactersByRpgId = new Map<
    string,
    Array<{ id: string; name: string }>
  >()
  for (const character of user.characters) {
    const characters = charactersByRpgId.get(character.rpgId) ?? []
    characters.push({ id: character.id, name: character.name })
    charactersByRpgId.set(character.rpgId, characters)
  }

  const displayNameByRpgId = new Map(
    user.rpgDisplayNames.map((profile) => [
      profile.rpgId,
      profile.displayName?.trim() || null,
    ]),
  )
  const profileImageByRpgId = new Map(
    user.rpgDisplayNames.map((profile) => [
      profile.rpgId,
      profile.profileImageUrl?.trim() || null,
    ]),
  )

  const rpgProfilesById = new Map<string, ProfileRpgSummary>()

  for (const rpg of user.ownedRpgs) {
    rpgProfilesById.set(rpg.id, {
      id: rpg.id,
      title: rpg.title,
      nickname: displayNameByRpgId.get(rpg.id) ?? null,
      profileImageUrl: profileImageByRpgId.get(rpg.id) ?? null,
      joinedAt: rpg.createdAt,
      characters: charactersByRpgId.get(rpg.id) ?? [],
    })
  }

  for (const membership of user.memberships) {
    if (rpgProfilesById.has(membership.rpgId)) {
      continue
    }

    rpgProfilesById.set(membership.rpgId, {
      id: membership.rpgId,
      title: membership.rpgTitle,
      nickname: displayNameByRpgId.get(membership.rpgId) ?? null,
      profileImageUrl: profileImageByRpgId.get(membership.rpgId) ?? null,
      joinedAt:
        membership.respondedAt ??
        membership.requestedAt ??
        membership.createdAt,
      characters: charactersByRpgId.get(membership.rpgId) ?? [],
    })
  }

  return Array.from(rpgProfilesById.values()).sort((a, b) =>
    a.title.localeCompare(b.title, "pt-BR"),
  )
}

export function buildProfileViewData(params: {
  user: ProfileUserRecord | null
  fallbackEmail: string
}): ProfileViewData {
  return {
    name: params.user?.name ?? null,
    username: params.user?.username ?? null,
    email: params.user?.email ?? params.fallbackEmail,
    createdAt: params.user?.createdAt ?? null,
    rpgProfiles: buildProfileRpgProfiles(params.user),
  }
}
