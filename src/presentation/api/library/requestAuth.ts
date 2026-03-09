import type { NextRequest } from "next/server"
import { getUserIdFromRequestToken } from "@/lib/server/rpgLibraryAccess"

export async function getUserIdFromRequest(request: NextRequest) {
  return getUserIdFromRequestToken(request)
}
