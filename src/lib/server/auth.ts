import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME } from "@/lib/auth/constants"
import { verifyAuthToken } from "@/lib/auth/token"
import { getUserIdFromRequest as getUserIdFromAuthRequest } from "@/lib/auth/requestAuth"

export async function getUserIdFromRequest(
  request: Request,
): Promise<string | null> {
  return getUserIdFromAuthRequest(request)
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
