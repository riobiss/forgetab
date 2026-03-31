import { getUserIdFromRequestToken } from "@/lib/server/rpgLibraryAccess"

export async function getUserIdFromRequest(request: Request) {
  return getUserIdFromRequestToken(request)
}
