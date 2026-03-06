import type { NextRequest } from "next/server"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

export async function getUserIdFromRequest(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) {
    return null
  }

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}
