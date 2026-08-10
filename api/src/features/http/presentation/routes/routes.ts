import type { FastifyInstance } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"
import { writeJson } from "@/features/http/presentation/fastifyJson"

export function httpRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/health", async (_request, reply) =>
    writeJson(reply, 200, { ok: true, service: "forgetab-api" })
  )
}
