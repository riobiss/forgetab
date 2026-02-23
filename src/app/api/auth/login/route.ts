import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  createAuthToken,
  TOKEN_COOKIE_NAME,
  TOKEN_EXPIRES_IN_SECONDS,
} from "@/lib/auth/token"
import { comparePassword } from "@/lib/auth/password"
import { loginSchema } from "@/lib/validators/auth"
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit"

const LOGIN_RATE_LIMIT = {
  ipLimit: 20,
  emailPerIpLimit: 8,
  windowMs: 15 * 60 * 1000,
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const ipRate = await checkRateLimit(
      `login:ip:${clientIp}`,
      LOGIN_RATE_LIMIT.ipLimit,
      LOGIN_RATE_LIMIT.windowMs,
    )

    if (!ipRate.allowed) {
      return NextResponse.json(
        { message: "Muitas tentativas. Tente novamente em instantes." },
        {
          status: 429,
          headers: { "Retry-After": String(ipRate.retryAfterSeconds) },
        },
      )
    }

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const { email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()
    const emailRate = await checkRateLimit(
      `login:email:${clientIp}:${normalizedEmail}`,
      LOGIN_RATE_LIMIT.emailPerIpLimit,
      LOGIN_RATE_LIMIT.windowMs,
    )

    if (!emailRate.allowed) {
      return NextResponse.json(
        { message: "Muitas tentativas. Tente novamente em instantes." },
        {
          status: 429,
          headers: { "Retry-After": String(emailRate.retryAfterSeconds) },
        },
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ message: "Credenciais invalidas." }, { status: 401 })
    }

    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ message: "Credenciais invalidas." }, { status: 401 })
    }

    const token = await createAuthToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    })

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TOKEN_EXPIRES_IN_SECONDS,
    })

    return response
  } catch {
    return NextResponse.json(
      { message: "Erro interno ao autenticar usuario." },
      { status: 500 },
    )
  }
}
