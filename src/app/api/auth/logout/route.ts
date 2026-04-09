import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { buildApiUrl } from "@/infrastructure/http/backendUrls"
import { TOKEN_COOKIE_NAME } from "@/lib/auth/constants"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

  try {
    const apiLogoutUrl = buildApiUrl("/api/auth/logout")
    const apiUrl = new URL(apiLogoutUrl)
    const currentUrl = new URL(request.url)

    if (apiUrl.origin !== currentUrl.origin || apiUrl.pathname !== currentUrl.pathname) {
      await fetch(apiLogoutUrl, {
        method: "POST",
        cache: "no-store",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      })
    }
  } catch {
    // The frontend session should still be cleared even if the external API is unreachable.
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  })
  return response
}
