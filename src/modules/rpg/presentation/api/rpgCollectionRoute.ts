import { NextRequest, NextResponse } from "next/server"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createRpg } from "@/modules/rpg/application/useCases/createRpg"
import { AppError } from "@/modules/rpg/domain/errors"
import { prismaRpgRepository } from "@/modules/rpg/infrastructure/repositories/prismaRpgRepository"

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

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
    return toErrorResponse(error, "Erro interno ao criar RPG.")
  }
}
