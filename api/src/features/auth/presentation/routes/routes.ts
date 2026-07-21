import { registerFastifyRoute } from "@/fastifyRoute"
import { FastifyInstance } from "fastify"

import {
  healthHandler,
  loginHandler,
  logoutHandler,
  registerHandler,
} from "@/features/auth/presentation/handlers"

export function authRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/health", (_request, reply) =>
    healthHandler(reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/login", (request, reply) =>
    loginHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/register", (request, reply) =>
    registerHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/logout", (_request, reply) =>
    logoutHandler(reply),
  )
}
