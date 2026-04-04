const configuredFrontendUrl = process.env.FRONTEND_URL?.trim()

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "")
}

export function resolveAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin")?.trim()
  if (!origin) {
    return null
  }

  if (!configuredFrontendUrl) {
    return origin
  }

  return normalizeOrigin(origin) === normalizeOrigin(configuredFrontendUrl) ? origin : null
}

export function appendCorsHeaders(response: Response, request: Request) {
  const allowedOrigin = resolveAllowedOrigin(request)
  if (!allowedOrigin) {
    return response
  }

  const headers = new Headers(response.headers)
  headers.set("Access-Control-Allow-Origin", allowedOrigin)
  headers.set("Access-Control-Allow-Credentials", "true")
  headers.set("Vary", "Origin")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export function createCorsPreflightResponse(request: Request) {
  const allowedOrigin = resolveAllowedOrigin(request)
  if (!allowedOrigin) {
    return new Response(null, { status: 403 })
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      Vary: "Origin",
    },
  })
}
