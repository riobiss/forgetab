import { NextRequest, NextResponse } from "next/server"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createRpg } from "@/application/rpgManagement/use-cases/createRpg"
import { prismaRpgRepository } from "@/infrastructure/rpgManagement/repositories/prismaRpgRepository"
import { AppError } from "@/shared/errors/AppError"
import { toErrorResponse } from "@/presentation/api/shared/toErrorResponse"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  let authPayload: Awaited<ReturnType<typeof verifyAuthToken>>
  try {
    authPayload = await verifyAuthToken(token)
  } catch {
    return NextResponse.json({ message: "Token invalido." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = await createRpg(
      { repository: prismaRpgRepository },
      { userId: authPayload.userId, body },
    )
    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return toErrorResponse(error, "Erro interno ao criar RPG.")
    }
    return toErrorResponse(error, "Erro interno ao criar RPG.")
  }
}
