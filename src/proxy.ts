import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { TOKEN_COOKIE_NAME, jwtSecret } from "@/lib/auth/token"

const authPages = new Set(["/login", "/register"])
const csrfProtectedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])

function getRequestOrigin(request: NextRequest) {
  const originHeader = request.headers.get("origin")
  if (originHeader) {
    try {
      return new URL(originHeader)
    } catch {
      return null
    }
  }

  const refererHeader = request.headers.get("referer")
  if (refererHeader) {
    try {
      return new URL(refererHeader)
    } catch {
      return null
    }
  }

  return null
}

function isLikelySameOriginRequest(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase()
  return fetchSite === "same-origin" || fetchSite === "same-site"
}

function getExpectedHosts(request: NextRequest) {
  const candidates = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    request.nextUrl.host,
  ]

  return new Set(
    candidates
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0),
  )
}

function isTrustedLocalAliasHost(originHost: string, expectedHosts: Set<string>) {
  const localHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"])

  const [originHostname, originPort = ""] = originHost.toLowerCase().split(":")
  if (!localHostnames.has(originHostname)) return false

  for (const expectedHost of expectedHosts) {
    const [expectedHostname, expectedPort = ""] = expectedHost.toLowerCase().split(":")
    if (!localHostnames.has(expectedHostname)) continue
    if (originPort === expectedPort) return true
  }

  return false
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    if (csrfProtectedMethods.has(request.method.toUpperCase())) {
      const requestOrigin = getRequestOrigin(request)
      const expectedHosts = getExpectedHosts(request)

      // Some browsers/privacy settings may omit Origin/Referer on same-origin requests.
      const missingOriginButSameOrigin = !requestOrigin && isLikelySameOriginRequest(request)
      const originHost = requestOrigin?.host.toLowerCase() ?? null
      const matchesExpectedHost = originHost ? expectedHosts.has(originHost) : false
      const trustedLocalAlias = originHost
        ? isTrustedLocalAliasHost(originHost, expectedHosts)
        : false

      if (
        (!requestOrigin && !missingOriginButSameOrigin) ||
        (requestOrigin && !matchesExpectedHost && !trustedLocalAlias)
      ) {
        return NextResponse.json(
          { message: "Requisicao bloqueada por protecao CSRF." },
          { status: 403 },
        )
      }
    }

    return NextResponse.next()
  }

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value

  if (!token) {
    if (authPages.has(pathname)) {
      return NextResponse.next()
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, jwtSecret)

    if (authPages.has(pathname)) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  } catch {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${search}`)

    const response = NextResponse.redirect(loginUrl)
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    })

    return response
  }
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
