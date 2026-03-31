import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { getUserIdFromRequest as getUserIdFromBackendRequest } from "@/backend/auth/requestAuth"

export async function getUserIdFromRequest(
  request: Request,
): Promise<string | null> {
  return getUserIdFromBackendRequest(request)
}

export async function getUserIdFromCookieStore(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value
    if (!token) {
      return null
    }

    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}
