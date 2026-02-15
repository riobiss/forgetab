import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

export async function getUserIdFromRequest(
  request: NextRequest,
): Promise<string | null> {
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
