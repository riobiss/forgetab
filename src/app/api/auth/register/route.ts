import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../../generated/prisma/client.js"
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

const GENERIC_REGISTER_CONFLICT_MESSAGE =
  "Nao foi possivel concluir o cadastro com os dados informados."
const USERNAME_CONFLICT_MESSAGE = "Username ja esta em uso. Tente outro."

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const ipRate = await checkRateLimit(
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

    const { name, username, email, password } = parsed.data
    const normalizedUsername = username.toLowerCase()
    const normalizedEmail = email.toLowerCase()
    const emailRate = await checkRateLimit(
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
        { message: GENERIC_REGISTER_CONFLICT_MESSAGE },
        { status: 409 },
      )
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    })

    if (existingUsername) {
      return NextResponse.json(
        { message: USERNAME_CONFLICT_MESSAGE },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        name,
        username: normalizedUsername,
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
          username: user.username,
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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : []
      if (target.includes("username")) {
        return NextResponse.json(
          { message: USERNAME_CONFLICT_MESSAGE },
          { status: 409 },
        )
      }

      return NextResponse.json(
        { message: GENERIC_REGISTER_CONFLICT_MESSAGE },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao cadastrar usuario." },
      { status: 500 },
    )
  }
}
