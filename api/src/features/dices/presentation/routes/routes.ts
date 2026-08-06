import { registerFastifyRoute } from "@/fastifyRoute"
import { FastifyInstance } from "fastify"
import { rollDicesHandler } from "@/features/dices/presentation/handlers"

export function dicesRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "post", "/api/dices/roll", (request, reply) =>
    rollDicesHandler(request, reply)
  )
}
