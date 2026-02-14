import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  createAuthToken,
  TOKEN_COOKIE_NAME,
  TOKEN_EXPIRES_IN_SECONDS,
} from "@/lib/auth/token"
import { hashPassword } from "@/lib/auth/password"
import { registerSchema } from "@/lib/validators/auth"
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit"

const REGISTER_RATE_LIMIT = {
  ipLimit: 12,
  emailPerIpLimit: 4,
  windowMs: 60 * 60 * 1000,
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const ipRate = checkRateLimit(
      `register:ip:${clientIp}`,
      REGISTER_RATE_LIMIT.ipLimit,
      REGISTER_RATE_LIMIT.windowMs,
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
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const { name, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()
    const emailRate = checkRateLimit(
      `register:email:${clientIp}:${normalizedEmail}`,
      REGISTER_RATE_LIMIT.emailPerIpLimit,
      REGISTER_RATE_LIMIT.windowMs,
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

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Email ja cadastrado." },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    })

    const token = await createAuthToken({ userId: user.id, email: user.email })
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    )

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
      { message: "Erro interno ao cadastrar usuario." },
      { status: 500 },
    )
  }
}
