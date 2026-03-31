import {
  listRpgMembersHandler,
  requestJoinRpgHandler,
} from "@/backend/routes/rpgMembership/handlers"

type RouteContext = { params: Promise<{ rpgId: string }> }

export async function GET(request: Request, context: RouteContext) {
  return listRpgMembersHandler(request, await context.params)
}

export async function POST(request: Request, context: RouteContext) {
  return requestJoinRpgHandler(request, await context.params)
}
