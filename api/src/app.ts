import Fastify, { type FastifyReply, type FastifyRequest } from "fastify"
import { appendCorsHeaders, createCorsPreflightResponse } from "@api/presentation/http/cors"
import { registerApiRoutes } from "@api/registerApiRoutes"

const apiPort = Number(process.env.API_PORT ?? 4000)

function normalizeRequestBody(body: unknown) {
  if (body == null) {
    return undefined
  }

  if (
    typeof body === "string" ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body
  }

  return JSON.stringify(body)
}

function getRequestUrl(request: FastifyRequest) {
  const protocol = request.headers["x-forwarded-proto"] ?? request.protocol ?? "http"
  const host = request.headers.host ?? `localhost:${apiPort}`
  return `${protocol}://${host}${request.url}`
}

function toWebRequest(request: FastifyRequest) {
  const method = request.method ?? "GET"
  const body = method === "GET" || method === "HEAD" ? undefined : normalizeRequestBody(request.body)

  return new Request(getRequestUrl(request), {
    method,
    headers: new Headers(request.headers as Record<string, string>),
    body,
    duplex: body ? "half" : undefined,
  } as RequestInit & { duplex?: "half" })
}

async function sendWebResponse(reply: FastifyReply, response: Response) {
  reply.code(response.status)

  response.headers.forEach((value, key) => {
    reply.header(key, value)
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  return reply.send(buffer)
}

function createNotFoundResponse() {
  return new Response(JSON.stringify({ message: "Rota nao encontrada." }), {
    status: 404,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })
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

    const webRequest = toWebRequest(request)
    const response = appendCorsHeaders(createCorsPreflightResponse(webRequest), webRequest)
    return sendWebResponse(reply, response)
  })

  registerApiRoutes(app, toWebRequest, sendWebResponse)

  app.setNotFoundHandler(async (request, reply) => {
    const webRequest = toWebRequest(request)
    return sendWebResponse(reply, appendCorsHeaders(createNotFoundResponse(), webRequest))
  })

  return app
}

export async function startApiServer() {
  const app = buildApiServer()
  await app.listen({ port: apiPort, host: "0.0.0.0" })
  console.log(`Forgetab API listening on http://localhost:${apiPort}`)
  return app
}
