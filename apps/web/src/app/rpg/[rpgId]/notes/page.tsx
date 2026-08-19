import { cookieCurrentUserSessionService } from "@/features/session/infrastructure/services/cookieCurrentUserSessionService"
import { LocalNotesPage } from "@/features/world/notes/presentation/LocalNotesPage"
import { resolveNotesReturnPath } from "@/features/world/notes/presentation/notesNavigation"

type Props = {
  params: Promise<{ rpgId: string }>
  searchParams: Promise<{ returnTo?: string | string[] }>
}

export default async function LocalNotesRoute({ params, searchParams }: Props) {
  const { rpgId } = await params
  const requestedReturnPath = (await searchParams).returnTo
  const returnPath = resolveNotesReturnPath(
    rpgId,
    Array.isArray(requestedReturnPath)
      ? requestedReturnPath[0]
      : requestedReturnPath
  )
  const userId =
    (await cookieCurrentUserSessionService.getCurrentUserId()) ?? "anonymous"
  return (
    <LocalNotesPage rpgId={rpgId} userId={userId} returnPath={returnPath} />
  )
}
