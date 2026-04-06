import { getUserIdFromRequest as getUserIdFromAuthRequest } from "@/lib/auth/requestAuth"

export async function getUserIdFromRequest(
  request: Request,
): Promise<string | null> {
  return getUserIdFromAuthRequest(request)
}

export async function getUserIdFromCookieStore(): Promise<string | null> {
  return null
}
