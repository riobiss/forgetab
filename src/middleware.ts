import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { TOKEN_COOKIE_NAME, jwtSecret } from "@/lib/auth/token"

const authPages = new Set(["/login", "/cadastro"])

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}

