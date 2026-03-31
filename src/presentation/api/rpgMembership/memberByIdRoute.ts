import {
  expelMemberHandler,
  processMemberActionHandler,
} from "@/backend/routes/rpgMembership/handlers"

type RouteContext = { params: Promise<{ rpgId: string; memberId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  return processMemberActionHandler(request, await context.params)
}

export async function DELETE(request: Request, context: RouteContext) {
  return expelMemberHandler(request, await context.params)
}
