import { NextRequest, NextResponse } from "next/server"
import { getItemsDashboardData } from "@/application/items/use-cases/getItemsDashboardData"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"
import { toErrorResponse } from "@/presentation/api/items/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId } = await context.params
    const payload = await getItemsDashboardData(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId, userId },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar dashboard de itens.")
  }
}
