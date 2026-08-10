type ApiErrorPayload = {
  message?: unknown
}

type ParseApiResponseOptions = {
  fallbackMessage?: string
  invalidResponseMessage?: string
  errorFactory?: (message: string, status: number) => Error
}

export class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "ApiResponseError"
  }
}

function readErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null

  const message = (payload as ApiErrorPayload).message
  return typeof message === "string" && message.trim() ? message : null
}

async function readJsonPayload(response: Response) {
  const rawBody = await response.text()
  if (!rawBody.trim()) return null

  try {
    return JSON.parse(rawBody) as unknown
  } catch {
    return null
  }
}

export async function parseApiResponse<T>(
  response: Response,
  options: ParseApiResponseOptions = {}
): Promise<T> {
  const payload = await readJsonPayload(response)

  if (!response.ok) {
    const message =
      readErrorMessage(payload) ??
      options.fallbackMessage ??
      "Erro na requisicao."
    throw (
      options.errorFactory?.(message, response.status) ??
      new ApiResponseError(message, response.status)
    )
  }

  if (payload == null) {
    throw new Error(
      options.invalidResponseMessage ?? "Resposta invalida da API."
    )
  }

  return payload as T
}

export async function ensureApiResponse(
  response: Response,
  options: ParseApiResponseOptions = {}
): Promise<void> {
  if (response.ok) return

  const payload = await readJsonPayload(response)

  const message =
    readErrorMessage(payload) ??
    options.fallbackMessage ??
    "Erro na requisicao."
  throw (
    options.errorFactory?.(message, response.status) ??
    new ApiResponseError(message, response.status)
  )
}

export function createApiResponseParser(options: ParseApiResponseOptions) {
  return <T>(response: Response) => parseApiResponse<T>(response, options)
}
