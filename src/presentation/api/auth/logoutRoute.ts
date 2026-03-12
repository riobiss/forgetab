import { NextResponse } from "next/server"
import { logoutUseCase } from "@/application/auth/use-cases/logout"
import { jwtAuthTokenService } from "@/infrastructure/auth/services/jwtAuthTokenService"

export async function POST() {
  const result = logoutUseCase(jwtAuthTokenService.getCookieConfig())
  const response = NextResponse.json({ ok: result.ok })

  response.cookies.set({
    name: result.cookie.name,
    value: result.cookie.value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.cookie.maxAge,
  })

  return response
}
