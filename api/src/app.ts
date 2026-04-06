import Fastify from "fastify"
import type { IncomingHttpHeaders } from "node:http"
import { resolveAllowedOrigin } from "@api/presentation/http/cors"
import { registerApiRoutes } from "@api/registerApiRoutes"

const apiPort = Number(process.env.PORT ?? process.env.API_PORT ?? 4000)

function applyCorsHeaders(
  headers: IncomingHttpHeaders | Headers,
  reply: { header: (name: string, value: string) => unknown },
) {
  const allowedOrigin = resolveAllowedOrigin(headers)
  if (!allowedOrigin) {
    return null
  }

  reply.header("Access-Control-Allow-Origin", allowedOrigin)
  reply.header("Access-Control-Allow-Credentials", "true")
  reply.header("Vary", "Origin")
  return allowedOrigin
}

export function buildApiServer() {
  const app = Fastify({
    logger: false,
  })

  app.removeAllContentTypeParsers()
  app.addContentTypeParser("*", { parseAs: "buffer" }, (_request, body, done) => {
    done(null, body)
  })

  app.addHook("onRequest", async (request, reply) => {
    if (request.method !== "OPTIONS") {
      return
    }

    const allowedOrigin = applyCorsHeaders(request.headers, reply)
    if (!allowedOrigin) {
      return reply.code(403).send()
    }

    reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS")
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return reply.code(204).send()
  })

  registerApiRoutes(app)

  app.setNotFoundHandler(async (request, reply) => {
    applyCorsHeaders(request.headers, reply)
    reply.header("Content-Type", "application/json; charset=utf-8")
    return reply.code(404).send({ message: "Rota nao encontrada." })
  })

  return app
}

export async function startApiServer() {
  const app = buildApiServer()
  await app.listen({ port: apiPort, host: "0.0.0.0" })
  console.log(`Forgetab API listening on http://localhost:${apiPort}`)
  return app
}
